// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import { wrapCommand } from "./novaUtils";
import { showLocation } from "./showLocation";

// https://stackoverflow.com/a/6969486
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

const hr = new RegExp("^" + escapeRegExp(`file://${nova.environment["HOME"]}`));
function cleanPath(path: string) {
  const decodedPath = decodeURIComponent(path);
  const wr = new RegExp("^" + escapeRegExp(`file://${nova.workspace.path}`));
  return decodedPath.replace(wr, ".").replace(hr, "~");
}

type MyTreeProvider<T> = TreeDataProvider<T> & {
  onSelect(element: T): Promise<void>;
};

let lastDisposable: Disposable | null = null;

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
): MyTreeProvider<string | lspTypes.SymbolInformation> {
  // group results by file
  const files = new Map<string, Array<lspTypes.SymbolInformation>>();
  response.forEach((r) => {
    if (!files.has(r.location.uri)) {
      files.set(r.location.uri, []);
    }
    files.get(r.location.uri)?.push(r);
  });

  return {
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
      const position = element.location.range.start;
      item.image = `__symbol.${symbolKindToNovaSymbol[element.kind]}`;
      item.tooltip = `${element.location.uri}:${position.line}:${position.character}`;
      item.command = "apexskier.typescript.showSearchResult";
      return item;
    },
    async onSelect(element) {
      if (typeof element !== "string") {
        await showLocation(element.location);
      }
    },
  };
}

function locationSearchResultsTreeProvider(
  name: string,
  locations: Array<lspTypes.Location>
): MyTreeProvider<string | lspTypes.Location> {
  // group results by file
  const files = new Map<string, Array<lspTypes.Location>>();
  locations.forEach((r) => {
    if (!files.has(r.uri)) {
      files.set(r.uri, []);
    }
    files.get(r.uri)?.push(r);
  });

  return {
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
    async onSelect(element) {
      if (typeof element !== "string") {
        await showLocation(element);
      }
    },
  };
}

function showTreeView<T>(dataProvider: MyTreeProvider<T>) {
  lastDisposable?.dispose();

  const compositeDisposable = new CompositeDisposable();

  const treeView = new TreeView("apexskier.typescript.sidebar.symbols", {
    dataProvider,
  });
  compositeDisposable.add(treeView);

  // can't figure out how to force open the view, but if most usage is from the sidebar directly it's okay?
  if (!treeView.visible) {
    nova.workspace.showInformativeMessage(
      "Done! View the TS/JS sidebar to see results."
    );
  }

  const command = nova.commands.register(
    "apexskier.typescript.showSearchResult",
    wrapCommand(async () => {
      await Promise.all(treeView.selection.map(dataProvider.onSelect));
    })
  );
  compositeDisposable.add(command);

  lastDisposable = compositeDisposable;
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

const symbolKindToNovaSymbol: { [key in lspTypes.SymbolKind]: string } = {
  // const symbolKindToNovaSymbol: { [key in lspTypes.SymbolKind]: NovaSymbolType } = {
  1: "file",
  2: "package", // Module
  3: "package", // Namespace
  4: "package",
  5: "class",
  6: "method",
  7: "property",
  8: "Field",
  9: "constructor",
  10: "enum",
  11: "interface",
  12: "function",
  13: "variable",
  14: "constant",
  15: "variable", // String
  16: "variable", // Number
  17: "variable", // Boolean
  18: "variable", // Array
  19: "variable", // Object
  20: "keyword", // Key
  21: "variable", // Null
  22: "enum-member",
  23: "struct",
  24: "variable", // Event
  25: "expression", // Operator
  26: "type", // TypeParameter
};
