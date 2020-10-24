import { dependencyManagement } from "nova-extension-utils";
import { registerFindReferences } from "./commands/findReferences";
import { registerFindSymbol } from "./commands/findSymbol";
import { registerRename } from "./commands/rename";
import { registerSignatureHelp } from "./commands/signatureHelp";
import { wrapCommand } from "./novaUtils";
import { InformationView } from "./informationView";
import { getTsLibPath } from "./tsLibPath";
import { isEnabledForJavascript } from "./isEnabledForJavascript";

nova.commands.register(
  "apexskier.typescript.openWorkspaceConfig",
  wrapCommand(function openWorkspaceConfig(workspace: Workspace) {
    workspace.openConfig();
  })
);

nova.commands.register("apexskier.typescript.reload", reload);

dependencyManagement.registerDependencyUnlockCommand(
  "apexskier.typescript.forceClearLock"
);

let client: LanguageClient | null = null;
const compositeDisposable = new CompositeDisposable();

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
    await dependencyManagement.installWrappedDependencies(compositeDisposable);
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
    const logDir = nova.path.join(nova.workspace.path, "logs");
    await new Promise((resolve, reject) => {
      const p = new Process("/usr/bin/env", {
        args: ["mkdir", "-p", logDir],
      });
      p.onDidExit((status) => (status === 0 ? resolve() : reject()));
      p.start();
    });
    console.log("logging to", logDir);
    // passing inLog breaks some requests for an unknown reason
    // const inLog = nova.path.join(logDir, "languageServer-in.log");
    const outLog = nova.path.join(logDir, "languageServer-out.log");
    serviceArgs = {
      path: "/usr/bin/env",
      // args: ["bash", "-c", `tee "${inLog}" | "${runFile}" | tee "${outLog}"`],
      args: ["bash", "-c", `"${runFile}" | tee "${outLog}"`],
    };
  } else {
    serviceArgs = {
      path: runFile,
    };
  }

  const syntaxes = ["typescript", "tsx"];
  if (isEnabledForJavascript()) {
    syntaxes.push("javascript", "jsx");
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
        INSTALL_DIR: dependencyManagement.getDependencyDirectory(),
      },
    },
    {
      syntaxes,
    }
  );

  // register nova commands
  compositeDisposable.add(registerFindReferences(client));
  compositeDisposable.add(registerFindSymbol(client));
  compositeDisposable.add(registerRename(client));
  if (nova.inDevMode()) {
    compositeDisposable.add(registerSignatureHelp(client));
  }

  compositeDisposable.add(
    client.onDidStop((err) => {
      informationView.status = "Stopped";

      let message = "TypeScript Language Server stopped unexpectedly";
      if (err) {
        message += `:\n\n${err.toString()}`;
      } else {
        message += ".";
      }
      message +=
        "\n\nPlease report this, along with any output in the Extension Console.";
      nova.workspace.showActionPanel(
        message,
        {
          buttons: ["Restart", "Ignore"],
        },
        (index) => {
          if (index == 0) {
            nova.commands.invoke("apexskier.typescript.reload");
          }
        }
      );
    })
  );

  client.start();

  getTsVersion(tslibPath).then((version) => {
    informationView.tsVersion = version;
  });

  informationView.status = "Running";

  informationView.reload(); // this is needed, otherwise the view won't show up properly, possibly a Nova bug
}

export function activate() {
  console.log("activating...");
  if (nova.inDevMode()) {
    const notification = new NotificationRequest("activated");
    notification.body = "TypeScript extension is loading";
    nova.notifications.add(notification);
  }
  return asyncActivate()
    .catch((err) => {
      console.error("Failed to activate");
      console.error(err);
      nova.workspace.showErrorMessage(err);
    })
    .then(() => {
      console.log("activated");
    });
}

export function deactivate() {
  client?.stop();
  compositeDisposable.dispose();
}
