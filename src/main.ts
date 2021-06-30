import { dependencyManagement, preferences } from "nova-extension-utils";
import { registerFindReferences } from "./commands/findReferences";
import { registerFindSymbol } from "./commands/findSymbol";
import { registerOrganizeImports } from "./commands/organizeImports";
import { registerFormatDocument } from "./commands/formatDocument";
import { registerRename } from "./commands/rename";
import { registerSignatureHelp } from "./commands/signatureHelp";
import { InformationView } from "./informationView";
import { isEnabledForJavascript } from "./isEnabledForJavascript";
import { wrapCommand } from "./novaUtils";
import { getTsLibPath } from "./tsLibPath";

const organizeImportsOnSaveKey =
  "apexskier.typescript.config.organizeImportsOnSave";
const formatOnSaveKey = "apexskier.typescript.config.formatDocumentOnSave";

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
  return new Promise<void>((resolve, reject) => {
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
    await dependencyManagement.installWrappedDependencies(compositeDisposable, {
      console: {
        log: (...args: Array<unknown>) => {
          console.log("dependencyManagement:", ...args);
        },
        info: (...args: Array<unknown>) => {
          console.info("dependencyManagement:", ...args);
        },
        warn: (...args: Array<unknown>) => {
          console.warn("dependencyManagement:", ...args);
        },
      },
    });
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
    await new Promise<void>((resolve, reject) => {
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
  compositeDisposable.add(registerOrganizeImports(client));
  compositeDisposable.add(registerFormatDocument(client));
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

  // auto-organize imports on save
  compositeDisposable.add(
    nova.workspace.onDidAddTextEditor((editor) => {
      const editorDisposable = new CompositeDisposable();
      compositeDisposable.add(editorDisposable);
      compositeDisposable.add(
        editor.onDidDestroy(() => editorDisposable.dispose())
      );

      // watch things that might change if this needs to happen or not
      editorDisposable.add(editor.document.onDidChangeSyntax(refreshListener));
      editorDisposable.add(
        nova.config.onDidChange(organizeImportsOnSaveKey, refreshListener)
      );
      editorDisposable.add(
        nova.workspace.config.onDidChange(
          organizeImportsOnSaveKey,
          refreshListener
        )
      );
      editorDisposable.add(
        nova.config.onDidChange(formatOnSaveKey, refreshListener)
      );
      editorDisposable.add(
        nova.workspace.config.onDidChange(formatOnSaveKey, refreshListener)
      );

      let willSaveListener = setupListener();
      compositeDisposable.add({
        dispose() {
          willSaveListener?.dispose();
        },
      });

      function refreshListener() {
        willSaveListener?.dispose();
        willSaveListener = setupListener();
      }

      function setupListener() {
        if (
          !(syntaxes as Array<string | null>).includes(editor.document.syntax)
        ) {
          return;
        }
        const organizeImportsOnSave = preferences.getOverridableBoolean(
          organizeImportsOnSaveKey
        );
        const formatDocumentOnSave =
          preferences.getOverridableBoolean(formatOnSaveKey);
        if (!organizeImportsOnSave && !formatDocumentOnSave) {
          return;
        }
        return editor.onWillSave(async (editor) => {
          if (organizeImportsOnSave) {
            await nova.commands.invoke(
              "apexskier.typescript.commands.organizeImports",
              editor
            );
          }
          if (formatDocumentOnSave) {
            await nova.commands.invoke(
              "apexskier.typescript.commands.formatDocument",
              editor
            );
          }
        });
      }
    })
  );

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
  console.log("deactivate");
  compositeDisposable.dispose();
  client?.stop();
}
