import { registerGoToDefinition } from "./commands/goToDefinition";
import { registerRename } from "./commands/rename";
import { registerCodeAction } from "./commands/codeAction";
import { registerApplyEdit } from "./requests/applyEdit";
import { registerFindSymbol } from "./commands/findSymbol";
import { wrapCommand } from "./novaUtils";
import { informationView } from "./informationView";

// NOTE: this doesn't work - it's called repeatedly, not just when config changes
// nova.config.observe("apexskier.typescript.config.tslibPath");

nova.commands.register(
  "apexskier.typescript.openWorkspaceConfig",
  wrapCommand(function openWorkspaceConfig(workspace: Workspace) {
    workspace.openConfig("apexskier.typescript");
  })
);

let client: LanguageClient | null = null;
let commands: Array<Disposable> = [];

export async function activate() {
  console.log("activating...");

  informationView.status = "Activating...";

  // this determines which version of typescript is being run
  // it should be project specific, so find the best option in this order:
  // - explicitly configured
  // - best guess (installed in the main node_modules)
  // - bundled with plugin (no choice of version)
  let tslibPath: string;
  // I'd love it if workspace config path items were saved relative to the workspace, so they could be checked into source control
  // TODO: Configured tslib path isn't working
  const configTslib = nova.config.get(
    "apexskier.typescript.config.tslibPath",
    "string"
  );
  if (configTslib) {
    tslibPath = configTslib;
  } else if (
    nova.workspace.path &&
    nova.fs.access(
      nova.path.join(nova.workspace.path, "node_modules/typescript/lib"),
      nova.fs.F_OK
    )
  ) {
    tslibPath = nova.path.join(
      nova.workspace.path,
      "node_modules/typescript/lib"
    );
  } else {
    tslibPath = nova.path.join(
      nova.extension.path,
      "node_modules/typescript/lib"
    );
  }
  if (!nova.fs.access(tslibPath, nova.fs.F_OK)) {
    if (configTslib) {
      nova.workspace.showErrorMessage(
        "Your typescript library couldn't be found, please check your settings."
      );
    } else {
      console.error("typescript lib not found at", tslibPath);
    }
    return;
  }
  console.info("using tslib at:", tslibPath);

  const runFile = nova.path.join(nova.extension.path, "run.sh");
  // Uploading to the extension library makes this file not executable, so fix that
  await new Promise((resolve, reject) => {
    const process = new Process("/usr/bin/env", {
      args: ["chmod", "u+x", runFile],
    });
    process.onDidExit((status) => {
      if (status === 0) {
        resolve();
      } else {
        reject(status);
      }
    });
    process.start();
  });

  const serviceArgs =
    nova.inDevMode() && nova.workspace.path
      ? {
          path: "/usr/bin/env",
          // bash -c needs us to wrap in quotes when there are spaces in the path
          args: [
            "bash",
            "-c",
            `'${runFile}'`,
            "tee",
            "|",
            `${nova.path.join(
              nova.workspace.path,
              ".log",
              "languageClient.log"
            )}`,
          ],
        }
      : {
          path: runFile,
        };

  client = new LanguageClient(
    "apexskier.typescript",
    "Typescript Language Server",
    {
      type: "stdio",
      ...serviceArgs,
      env: {
        TSLIB_PATH: tslibPath,
        WORKSPACE_DIR: nova.workspace.path ?? "",
      },
    },
    {
      syntaxes: ["typescript", "javascript"],
    }
  );

  // register nova commands
  commands = [
    registerGoToDefinition(client),
    registerRename(client),
    registerCodeAction(client),
    registerFindSymbol(client),
  ];

  // register server-pushed commands
  registerApplyEdit(client);

  // Not working, I'm guessing Nova intercepts this notification.
  client.onNotification("initialized", () => {
    console.log("initialized");
  });

  client.onNotification("window/showMessage", (params) => {
    console.log("window/showMessage", JSON.stringify(params));
  });

  client.start();

  let versionProcess = new Process("/usr/bin/env", {
    args: ["node", nova.path.join(tslibPath, "tsc.js"), "--version"],
    stdio: ["ignore", "pipe", "ignore"],
  });
  versionProcess.onStdout((versionString) => {
    informationView.tsVersion = versionString.trim();
  });
  versionProcess.start();

  informationView.status = "Running";

  informationView.reload(); // this is needed, otherwise the view won't show up properly, possibly a Nova bug
}

export function deactivate() {
  client?.stop();
  commands.forEach((command) => command.dispose());
  informationView.status = "Deactivated";
}
