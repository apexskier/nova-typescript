import { registerGoToDefinition } from "./commands/goToDefinition";
import { registerRename } from "./commands/rename";
import { registerCodeAction } from "./commands/codeAction";
import { registerFindSymbol } from "./commands/findSymbol";
import { registerAutoSuggest } from "./commands/autoSuggest";
import { registerApplyEdit } from "./requests/applyEdit";
import { wrapCommand } from "./novaUtils";
import { InformationView } from "./informationView";
import { getTsLibPath } from "./tsLibPath";

nova.commands.register(
  "apexskier.typescript.openWorkspaceConfig",
  wrapCommand(function openWorkspaceConfig(workspace: Workspace) {
    workspace.openConfig("apexskier.typescript");
  })
);

nova.commands.register("apexskier.typescript.reload", reload);

let client: LanguageClient | null = null;
const compositeDisposable = new CompositeDisposable();

async function installWrappedDependencies() {
  return new Promise((resolve, reject) => {
    const process = new Process("/usr/bin/env", {
      args: ["npm", "install"],
      cwd: nova.extension.path,
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (nova.inDevMode()) {
      process.onStdout((o) => console.log("installing:", o.trimRight()));
    }
    process.onStderr((e) => console.warn("installing:", e.trimRight()));
    process.onDidExit((status) => {
      if (status === 0) {
        resolve();
      } else {
        reject(new Error("failed to install"));
      }
    });
    process.start();
  });
}

async function makeFileExecutable(file: string) {
  return new Promise((resolve, reject) => {
    const process = new Process("/usr/bin/env", {
      args: ["chmod", "u+x", file],
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
}

async function getTsVersion(tslibPath: string) {
  return new Promise<string>((resolve, reject) => {
    const process = new Process("/usr/bin/env", {
      args: ["node", nova.path.join(tslibPath, "tsc.js"), "--version"],
      stdio: ["ignore", "pipe", "ignore"],
    });
    let str = "";
    process.onStdout((versionString) => {
      str += versionString.trim();
    });
    process.onDidExit((status) => {
      if (status === 0) {
        resolve(str);
      } else {
        reject(status);
      }
    });
    process.start();
  });
}

async function reload() {
  deactivate();
  console.log("reloading...");
  await asyncActivate();
}

async function asyncActivate() {
  const informationView = new InformationView();
  compositeDisposable.add(informationView);

  informationView.status = "Activating...";

  try {
    await installWrappedDependencies();
  } catch (err) {
    informationView.status = "Failed to install";
    throw err;
  }

  const tslibPath = getTsLibPath();
  if (!tslibPath) {
    informationView.status = "No tslib";
    return;
  }
  console.info("using tslib at:", tslibPath);

  const runFile = nova.path.join(nova.extension.path, "run.sh");

  // Uploading to the extension library makes this file not executable, so fix that
  await makeFileExecutable(runFile);

  let serviceArgs;
  if (nova.inDevMode() && nova.workspace.path) {
    const logDir = nova.path.join(nova.workspace.path, ".log");
    console.log("logging to", logDir);

    // this breaks functionality
    // const inLog = nova.path.join(logDir, "languageClient-in.log");
    const outLog = nova.path.join(logDir, "languageClient-out.log");
    serviceArgs = {
      // path: runFile,
      path: "/usr/bin/env",
      // args: ["bash", "-c", `tee "${inLog}" | "${runFile}" | tee "${outLog}"`],
      args: ["bash", "-c", `"${runFile}" | tee "${outLog}"`],
    };
  } else {
    serviceArgs = {
      path: runFile,
    };
  }

  client = new LanguageClient(
    "apexskier.typescript",
    "TypeScript Language Server",
    {
      type: "stdio",
      ...serviceArgs,
      env: {
        TSLIB_PATH: tslibPath,
        WORKSPACE_DIR: nova.workspace.path ?? "",
      },
    },
    {
      syntaxes: ["typescript", "tsx", "javascript", "jsx"],
    }
  );

  // register nova commands
  compositeDisposable.add(registerGoToDefinition(client));
  compositeDisposable.add(registerRename(client));
  compositeDisposable.add(registerCodeAction(client));
  compositeDisposable.add(registerFindSymbol(client));
  compositeDisposable.add(registerAutoSuggest(client));

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

  getTsVersion(tslibPath).then((version) => {
    informationView.tsVersion = version;
  });

  informationView.status = "Running";

  informationView.reload(); // this is needed, otherwise the view won't show up properly, possibly a Nova bug
}

export function activate() {
  console.log("activating...");
  return asyncActivate()
    .catch((err) => {
      console.error("Failed to activate");
      console.error(err);
    })
    .then(() => {
      console.log("activated");
    });
}

export function deactivate() {
  client?.stop();
  compositeDisposable.dispose();
}
