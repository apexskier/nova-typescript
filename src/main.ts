import { registerGoToDefinition } from "./goToDefinition";
import { registerRename } from "./rename";
import { registerCodeAction } from "./codeAction";
import { wrapCommand } from "./utils";

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

export function activate() {
  console.log("activating...");

  // I'd love it if workspace config path items were saved relative to the workspace, so they could be checked into source control
  const tsserverPath =
    nova.config.get("apexskier.typescript.config.tsserverPath", "string") ??
    nova.workspace.path ? `${nova.workspace.path}/node_modules/.bin/tsserver` : "";
  console.log(tsserverPath);
  if (!nova.fs.access(tsserverPath, nova.fs.F_OK)) {
    // This could be improved
    nova.workspace.showErrorMessage(
      "Your tsserver couldn't be found, please configure it manually in yoru workspace extension settings."
    );
    
    return;
  }

  client = new LanguageClient(
    "apexskier.typescript",
    "Typescript Language Server",
    {
      type: "stdio",
      path: "/usr/bin/env",
      args: ["bash", "-c", `${nova.extension.path}/run.sh`],
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
  ];
  
  client.start();
}

export function deactivate() {
  console.log("deactivating...");
  client?.stop();
  commands.forEach((command) => command.dispose());
}
