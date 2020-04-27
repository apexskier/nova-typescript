const client = new LanguageClient(
  "apexskier.typescript",
  "Typescript Language Server",
  {
    type: "stdio",
    path: `${nova.extension.path}/run.sh`,
    env: {
      WORKSPACE_DIR: nova.workspace.path ?? "",
    },
  },
  {
    syntaxes: ["typescript"],
  }
);

export function activate() {
  console.log("activating...");
  client.start();
}

export function deactivate() {
  client.stop();
}
