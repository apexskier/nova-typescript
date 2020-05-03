// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import { wrapCommand } from "../novaUtils";
import { createSymbolSearchResultsTree } from "../searchResults";

// @Panic: this is totally decoupled from typescript, so it could totally be native to Nova

export function registerFindSymbol(client: LanguageClient) {
  let query: string | null = null;

  const compositeDisposable = new CompositeDisposable();
  compositeDisposable.add(
    nova.commands.register(
      "apexskier.typescript.findSymbol",
      wrapCommand(findSymbol)
    )
  );
  return compositeDisposable;

  async function findSymbol(workspace: Workspace) {
    console.log("apexskier.typescript.findSymbol");

    query = await new Promise<string | null>((resolve) => {
      if (query != null) {
        workspace.showInputPalette(
          "Search for a symbol name",
          { placeholder: query },
          resolve
        );
      } else {
        workspace.showInputPalette("Search for a symbol name", {}, resolve);
      }
    });

    if (!query) {
      return;
    }

    const params: lspTypes.WorkspaceSymbolParams = {
      query,
    };
    const response = (await client.sendRequest("workspace/symbol", params)) as
      | lspTypes.SymbolInformation[]
      | null;
    if (response == null || !response.length) {
      nova.workspace.showWarningMessage("Couldn't find symbol.");
      return;
    }

    createSymbolSearchResultsTree(response);
  }
}
