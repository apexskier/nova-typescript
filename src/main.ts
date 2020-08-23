import { getTsLibPath } from "./tsLibPath";

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

async function asyncActivate() {
  await installWrappedDependencies();

  const completionAssistant: CompletionAssistant = {
    provideCompletionItems(editor, context) {
      console.log("providing suggestions", editor.document.uri, context);
      return [];
    },
  };
  compositeDisposable.add(
    nova.assistants.registerCompletionAssistant("*", completionAssistant)
  );

  const tslibPath = getTsLibPath();
  if (!tslibPath) {
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

  // TEST CASES
  // 1: completions not provide
  client.start();

  // 2: completions provided

  // 3: completions provided
  client.start();
  client.stop();
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
