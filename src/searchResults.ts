// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import { openFile } from "./novaUtils";
import { lspRangeToRange } from "./lspNovaConversions";

// https://stackoverflow.com/a/6969486
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

let hr = new RegExp("^" + escapeRegExp(`file://${nova.environment["HOME"]}`));
function cleanPath(path: string) {
  const decodedPath = decodeURIComponent(path);
  let wr = new RegExp("^" + escapeRegExp(`file://${nova.workspace.path}`));
  return decodedPath.replace(wr, ".").replace(hr, "~");
}

type MyTreeProvider<T> = TreeDataProvider<T> & { onSelect(element: T): void };

let lastTreeView: TreeView<unknown> | null = null;

export function createSymbolSearchResultsTree(
  response: Array<lspTypes.SymbolInformation>
) {
  showTreeView(symbolInformationSearchResultsTreeProvider(response));
}

export function createLocationSearchResultsTree(
  name: string,
  locations: Array<lspTypes.Location>
) {
  showTreeView(locationSearchResultsTreeProvider(name, locations));
}

function symbolInformationSearchResultsTreeProvider(
  response: Array<lspTypes.SymbolInformation>
) {
  // group results by file
  const files = new Map<string, Array<lspTypes.SymbolInformation>>();
  response.forEach((r) => {
    if (!files.has(r.location.uri)) {
      files.set(r.location.uri, []);
    }
    files.get(r.location.uri)?.push(r);
  });

  const dataProvider: MyTreeProvider<string | lspTypes.SymbolInformation> = {
    getChildren(element) {
      if (element == null) {
        return Array.from(files.keys());
      } else if (typeof element === "string") {
        return files.get(element) ?? [];
      }
      return [];
    },
    getTreeItem(element) {
      if (typeof element === "string") {
        const item = new TreeItem(
          cleanPath(element),
          TreeItemCollapsibleState.Expanded
        );
        item.path = element;
        return item;
      }
      const item = new TreeItem(element.name, TreeItemCollapsibleState.None);
      item.descriptiveText = `${
        element.containerName ? `${element.containerName} > ` : ""
      }${symbolKindToText[element.kind]}${
        element.deprecated ? " (deprecated)" : ""
      }`;
      let position = element.location.range.start;
      item.tooltip = `${element.location.uri}:${position.line}:${position.character}`;
      return item;
    },
    onSelect(element) {
      if (typeof element !== "string") {
        handleLocation(element.location);
      }
    },
  };

  return dataProvider;
}

function locationSearchResultsTreeProvider(
  name: string,
  locations: Array<lspTypes.Location>
) {
  // group results by file
  const files = new Map<string, Array<lspTypes.Location>>();
  locations.forEach((r) => {
    if (!files.has(r.uri)) {
      files.set(r.uri, []);
    }
    files.get(r.uri)?.push(r);
  });

  const dataProvider: MyTreeProvider<string | lspTypes.Location> = {
    getChildren(element) {
      if (element == null) {
        return Array.from(files.keys());
      } else if (typeof element === "string") {
        return files.get(element) ?? [];
      }
      return [];
    },
    getTreeItem(element) {
      if (typeof element === "string") {
        const item = new TreeItem(
          cleanPath(element),
          TreeItemCollapsibleState.Expanded
        );
        item.path = element;
        return item;
      }
      return new TreeItem(name, TreeItemCollapsibleState.None);
    },
    onSelect(element) {
      if (typeof element !== "string") {
        handleLocation(element);
      }
    },
  };

  return dataProvider;
}

function showTreeView(dataProvider: MyTreeProvider<unknown>) {
  const treeView = new TreeView("apexskier.typescript.sidebar.symbols", {
    dataProvider,
  });

  treeView.onDidChangeSelection((elements) => {
    elements.forEach(dataProvider.onSelect);
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

  if (lastTreeView) {
    lastTreeView.dispose();
  }
  lastTreeView = treeView;

  return treeView;
}

async function handleLocation(location: lspTypes.Location) {
  const newEditor = await openFile(location.uri);
  if (!newEditor) {
    nova.workspace.showWarningMessage(`Failed to open ${location.uri}`);
    return;
  }
  showRangeInEditor(newEditor, location.range);
}

async function showRangeInEditor(editor: TextEditor, range: lspTypes.Range) {
  const novaRange = lspRangeToRange(editor.document, range);
  editor.addSelectionForRange(novaRange);
  editor.scrollToPosition(novaRange.start);
}

// pulled from types
// TODO: it would be nice to map each of these to a custom icon
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
