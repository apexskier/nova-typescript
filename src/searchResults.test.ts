// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import * as lsp from "vscode-languageserver-types";
import {
  createLocationSearchResultsTree,
  createSymbolSearchResultsTree,
} from "./searchResults";

(global as any).nova = Object.assign(nova, {
  commands: {
    register: jest.fn(),
  },
  workspace: {
    showInformativeMessage: jest.fn(),
    showErrorMessage(err: unknown) {
      throw err;
    },
    openFile: jest.fn(),
  },
});

class CompositeDisposableMock implements Disposable {
  private _disposables: Array<Disposable> = [];
  add(disposable: Disposable) {
    this._disposables.push(disposable);
  }
  dispose() {
    this._disposables.forEach((d) => d.dispose());
  }
}
(global as any).CompositeDisposable = CompositeDisposableMock;

function mockTreeViewImplementation() {
  return {
    reload: jest.fn(),
    onDidChangeSelection: jest.fn(),
    dispose: jest.fn(),
    visible: true,
  };
}
const TreeViewTypedMock: jest.Mock<TreeView<unknown>> = jest.fn();
const TreeViewMock: jest.Mock<Partial<TreeView<unknown>>> = TreeViewTypedMock;
(global as any).TreeView = TreeViewMock;

class MockTreeItem {
  // eslint-disable-next-line no-unused-vars
  constructor(readonly name: unknown, readonly state: unknown) {}
}
(global as any).TreeItem = MockTreeItem;
(global as any).TreeItemCollapsibleState = {
  None: Symbol("TreeItemCollapsibleState.None"),
};

beforeEach(() => {
  TreeViewMock.mockReset();
  TreeViewMock.mockImplementation(mockTreeViewImplementation);

  (nova.commands.register as jest.Mock)
    .mockReset()
    .mockReturnValue({ dispose: jest.fn() });
  (nova.workspace.showInformativeMessage as jest.Mock).mockReset();
  (nova.workspace.openFile as jest.Mock).mockReset();
});

describe("Symbol search results tree", () => {
  const symbols: lspTypes.SymbolInformation[] = [
    {
      name: "symbol1",
      kind: lsp.SymbolKind.String,
      location: {
        uri: "fileURI1",
        range: {
          start: { line: 1, character: 2 },
          end: { line: 3, character: 4 },
        },
      },
    },
    {
      name: "symbol2",
      kind: lsp.SymbolKind.Enum,
      location: {
        uri: "fileURI2",
        range: {
          start: { line: 5, character: 6 },
          end: { line: 7, character: 8 },
        },
      },
    },
    {
      name: "symbol3",
      kind: lsp.SymbolKind.Property,
      location: {
        uri: "fileURI2",
        range: {
          start: { line: 9, character: 10 },
          end: { line: 11, character: 12 },
        },
      },
    },
  ];

  it("prompts if the tree view isn't visible", () => {
    TreeViewMock.mockImplementation(() => ({
      ...mockTreeViewImplementation(),
      visible: false,
    }));
    createSymbolSearchResultsTree(symbols);
    expect(nova.workspace.showInformativeMessage).toHaveBeenCalledTimes(1);
  });

  it("registers a double click command to open each search result", async () => {
    TreeViewMock.mockImplementation(() => ({
      ...mockTreeViewImplementation(),
      selection: [symbols[0]],
    }));
    const mockEditor = {
      document: {
        getTextInRange() {
          return "";
        },
        eol: "\n",
      },
      addSelectionForRange: jest.fn(),
      scrollToPosition: jest.fn(),
    };
    nova.workspace.openFile = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve(mockEditor));

    createSymbolSearchResultsTree(symbols);
    expect(nova.commands.register).toBeCalledWith(
      "apexskier.typescript.showSearchResult",
      expect.any(Function)
    );
    const command = (nova.commands.register as jest.Mock).mock.calls[0][1];
    await command();

    expect(nova.workspace.openFile).toBeCalledTimes(1);
    expect(nova.workspace.openFile).toBeCalledWith("fileURI1");
    expect(mockEditor.addSelectionForRange).toBeCalledTimes(1);
    expect(mockEditor.scrollToPosition).toBeCalledTimes(1);
  });

  it("renders locations as TreeItems by files", async () => {
    createSymbolSearchResultsTree(symbols);
    const provider: TreeDataProvider<string | lspTypes.SymbolInformation> =
      TreeViewTypedMock.mock.calls[0][1].dataProvider;

    expect(provider.getChildren(null)).toEqual(["fileURI1", "fileURI2"]);
    expect(provider.getChildren(1 as any)).toEqual([]);
    expect(provider.getChildren("fileURI1")).toEqual([symbols[0]]);
    expect(provider.getChildren("fileURI2")).toEqual(symbols.slice(1));
    expect(provider.getTreeItem("fileURI1")).toMatchInlineSnapshot(`
      MockTreeItem {
        "name": "fileURI1",
        "path": "fileURI1",
        "state": undefined,
      }
    `);
    expect(provider.getTreeItem(symbols[0])).toMatchInlineSnapshot(`
      MockTreeItem {
        "command": "apexskier.typescript.showSearchResult",
        "descriptiveText": "String",
        "image": "__symbol.variable",
        "name": "symbol1",
        "state": Symbol(TreeItemCollapsibleState.None),
        "tooltip": "fileURI1:1:2",
      }
    `);
  });
});

describe("Location search results tree", () => {
  const locations: lspTypes.Location[] = [
    {
      uri: "fileURI1",
      range: {
        start: { line: 1, character: 2 },
        end: { line: 3, character: 4 },
      },
    },
    {
      uri: "fileURI2",
      range: {
        start: { line: 5, character: 6 },
        end: { line: 7, character: 8 },
      },
    },
    {
      uri: "fileURI2",
      range: {
        start: { line: 9, character: 10 },
        end: { line: 11, character: 12 },
      },
    },
  ];

  it("opens and selects the source when a result is focused", async () => {
    TreeViewMock.mockImplementation(() => ({
      ...mockTreeViewImplementation(),
      selection: [locations[0]],
    }));
    const mockEditor = {
      document: {
        getTextInRange() {
          return "";
        },
        eol: "\n",
      },
      addSelectionForRange: jest.fn(),
      scrollToPosition: jest.fn(),
    };
    nova.workspace.openFile = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve(mockEditor));

    createLocationSearchResultsTree("name", locations);
    expect(nova.commands.register).toBeCalledWith(
      "apexskier.typescript.showSearchResult",
      expect.any(Function)
    );
    const command = (nova.commands.register as jest.Mock).mock.calls[0][1];
    await command();

    expect(nova.workspace.openFile).toBeCalledTimes(1);
    expect(nova.workspace.openFile).toBeCalledWith("fileURI1");
    expect(mockEditor.addSelectionForRange).toBeCalledTimes(1);
    expect(mockEditor.scrollToPosition).toBeCalledTimes(1);
  });

  it("renders locations as TreeItems by files", async () => {
    createLocationSearchResultsTree("name", locations);
    const provider: TreeDataProvider<string | lspTypes.Location> =
      TreeViewTypedMock.mock.calls[0][1].dataProvider;

    expect(provider.getChildren(null)).toEqual(["fileURI1", "fileURI2"]);
    expect(provider.getChildren(1 as any)).toEqual([]);
    expect(provider.getChildren("fileURI1")).toEqual([locations[0]]);
    expect(provider.getChildren("fileURI2")).toEqual(locations.slice(1));
    expect(provider.getTreeItem("fileURI1")).toMatchInlineSnapshot(`
      MockTreeItem {
        "command": "apexskier.typescript.showSearchResult",
        "name": "fileURI1",
        "path": "fileURI1",
        "state": undefined,
      }
    `);
    expect(provider.getTreeItem(locations[0])).toMatchInlineSnapshot(`
      MockTreeItem {
        "command": "apexskier.typescript.showSearchResult",
        "descriptiveText": ":2:3",
        "name": "name",
        "state": Symbol(TreeItemCollapsibleState.None),
      }
    `);
  });

  it("cleans filepaths before rendering them", () => {
    (nova.workspace as any).path = "/workspace";
    createLocationSearchResultsTree("name", locations);
    const provider: TreeDataProvider<string | lspTypes.SymbolInformation> =
      TreeViewTypedMock.mock.calls[0][1].dataProvider;
    expect(provider.getTreeItem("file:///workspace/path").name).toBe("./path");
    expect(provider.getTreeItem("file:///home/path").name).toBe("~/path");
    expect(provider.getTreeItem("file:///path").name).toBe("/path");

    (nova.workspace as any).path = null;
    expect(
      provider.getTreeItem("file:///Volumes/Macintosh%20HD/home/path").name
    ).toBe("~/path");
  });
});

it.each([
  [() => createSymbolSearchResultsTree([])],
  [() => createLocationSearchResultsTree("name", [])],
])("prompts if the tree view isn't visible", (create) => {
  TreeViewMock.mockImplementation(() => ({
    ...mockTreeViewImplementation(),
    visible: false,
  }));
  create();
  expect(nova.workspace.showInformativeMessage).toHaveBeenCalledTimes(1);
});

it.each([
  [
    () => createSymbolSearchResultsTree([]),
    () => createSymbolSearchResultsTree([]),
  ],
  [
    () => createSymbolSearchResultsTree([]),
    () => createLocationSearchResultsTree("name", []),
  ],
  [
    () => createLocationSearchResultsTree("name", []),
    () => createSymbolSearchResultsTree([]),
  ],
  [
    () => createLocationSearchResultsTree("name", []),
    () => createSymbolSearchResultsTree([]),
  ],
])("disposes of subsequently created objects", (a, b) => {
  a();
  expect(TreeView).toHaveBeenCalledTimes(1);
  expect(TreeView).toHaveBeenCalledWith(
    "apexskier.typescript.sidebar.symbols",
    expect.anything()
  );
  expect(nova.workspace.showInformativeMessage).not.toBeCalled();
  const treeMock1 = TreeViewTypedMock.mock.results[0].value;
  expect(treeMock1.dispose).not.toBeCalled();
  expect(nova.commands.register).toBeCalledWith(
    "apexskier.typescript.showSearchResult",
    expect.any(Function)
  );
  (nova.commands.register as jest.Mock).mock.results.forEach(({ value }) => {
    expect(value.dispose).not.toBeCalled();
  });

  b();
  expect(TreeView).toHaveBeenCalledTimes(2);
  const treeMock2 = TreeViewTypedMock.mock.results[1].value;
  expect(treeMock1.dispose).toBeCalled();
  expect(treeMock2.dispose).not.toBeCalled();
  const command1 = (nova.commands.register as jest.Mock).mock.results[0].value;
  expect(command1.dispose).toBeCalled();
  const command2 = (nova.commands.register as jest.Mock).mock.results[1].value;
  expect(command2.dispose).toBeCalled();
});
