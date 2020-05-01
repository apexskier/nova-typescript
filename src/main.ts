import { registerGoToDefinition } from "./commands/goToDefinition";
import { registerRename } from "./commands/rename";
import { registerCodeAction } from "./commands/codeAction";
import { registerApplyEdit } from "./requests/applyEdit";
import { registerFindSymbol } from "./commands/findSymbol";
import { wrapCommand } from "./novaUtils";

// NOTE: this doesn't work - it's called repeatedly, not just when config changes
// nova.config.observe("apexskier.typescript.config.tsserverPath");

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

  // I'd love it if workspace config path items were saved relative to the workspace, so they could be checked into source control
  const tsserverPath =
    nova.config.get("apexskier.typescript.config.tsserverPath", "string") ??
    nova.workspace.path
      ? `${nova.workspace.path}/node_modules/.bin/tsserver`
      : "";
  console.info("using tsserver", tsserverPath);
  if (!nova.fs.access(tsserverPath, nova.fs.F_OK)) {
    // This could be improved
    nova.workspace.showErrorMessage(
      "Your tsserver couldn't be found, please configure it manually in your workspace extension settings."
    );

    return;
  }

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
        TSSERVER_PATH: tsserverPath,
        WORKSPACE_DIR: nova.workspace.path ?? "",
      },
    },
    {
      syntaxes: ["typescript", "javascript"],
    }
  );

  commands = [
    registerGoToDefinition(client),
    registerRename(client),
    registerCodeAction(client),
    registerFindSymbol(client),
  ];

  registerApplyEdit(client);

  client.start();
}

export function deactivate() {
  client?.stop();
  commands.forEach((command) => command.dispose());
}
