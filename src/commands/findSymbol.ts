// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import { wrapCommand, openFile } from "../novaUtils";
import { lspRangeToRange } from "../lspNovaConversions";

// @Panic: this is totally decoupled from typescript, so it could totally be native to Nova

export function registerFindSymbol(client: LanguageClient) {
  let query: string | null = null;
  let lastTreeView: TreeView<unknown> | null = null;

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

    const dataProvider: TreeDataProvider<lspTypes.SymbolInformation> = {
      getChildren(element) {
        if (element == null) {
          return response;
        }
        return [];
      },
      getTreeItem(element) {
        const item = new TreeItem(element.name, TreeItemCollapsibleState.None);
        item.descriptiveText = `${
          element.containerName ? `${element.containerName} > ` : ""
        }${symbolKindToText[element.kind]}${
          element.deprecated ? " (deprecated)" : ""
        }`;
        item.path = element.location.uri;
        let position = element.location.range.start;
        item.tooltip = `${element.location.uri}:${position.line}:${position.character}`;
        return item;
      },
    };

    const treeView = new TreeView("apexskier.typescript.sidebar.symbols", {
      dataProvider,
    });
    if (lastTreeView) {
      compositeDisposable.remove(lastTreeView);
      lastTreeView.dispose();
    }
    lastTreeView = treeView;
    compositeDisposable.add(treeView);

    treeView.onDidChangeSelection((elements) => {
      elements.forEach((element) => {
        handleLocation(element.location);
      });
    });

    // can't figure out how to force open the view, but if most usage is from the sidebar directly it's okay?

    // TODO: Opening the treeview may be broken
    // treeView.reveal(response[0], {
    //   select: false,
    //   focus: true,
    // });
    // await treeView.reload();

    if (!treeView.visible) {
      nova.workspace.showInformativeMessage(
        "Done! View the TS/JS sidebar to see results."
      );
    }
  }
}

async function showRangeInEditor(editor: TextEditor, range: lspTypes.Range) {
  const novaRange = lspRangeToRange(editor.document, range);
  editor.addSelectionForRange(novaRange);
  editor.scrollToPosition(novaRange.start);
}

async function handleLocation(location: lspTypes.Location) {
  const newEditor = await openFile(location.uri);
  if (!newEditor) {
    nova.workspace.showWarningMessage(`Failed to open ${location.uri}`);
    return;
  }
  showRangeInEditor(newEditor, location.range);
}

const symbolKindToText: { [key in lspTypes.SymbolKind]: string } = {
  1: "File",
  2: "Module",
  3: "Namespace",
  4: "Package",
  5: "Class",
  6: "Method",
  7: "Property",
  8: "Field",
  9: "Constructor",
  10: "Enum",
  11: "Interface",
  12: "Function",
  13: "Variable",
  14: "Constant",
  15: "String",
  16: "Number",
  17: "Boolean",
  18: "Array",
  19: "Object",
  20: "Key",
  21: "Null",
  22: "EnumMember",
  23: "Struct",
  24: "Event",
  25: "Operator",
  26: "TypeParameter",
};
