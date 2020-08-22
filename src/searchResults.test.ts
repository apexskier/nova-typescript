// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import * as lsp from "vscode-languageserver-types";
import {
  createSymbolSearchResultsTree,
  createLocationSearchResultsTree,
} from "./searchResults";

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
  constructor(readonly title: unknown, readonly state: unknown) {}
}
(global as any).TreeItem = MockTreeItem;
(global as any).TreeItemCollapsibleState = {
  None: Symbol("TreeItemCollapsibleState.None"),
};

beforeEach(() => {
  TreeViewMock.mockReset();
  TreeViewMock.mockImplementation(mockTreeViewImplementation);

  (global as any).nova = Object.assign(nova, {
    workspace: {
      showInformativeMessage: jest.fn(),
      openFile: jest.fn(),
    },
  });
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

  it("opens and selects the source when a result is focused", async () => {
    TreeViewMock.mockImplementation(() => ({
      ...mockTreeViewImplementation(),
      onDidChangeSelection: jest.fn(),
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
    const treeMock = TreeViewTypedMock.mock.results[0].value;
    expect(treeMock.onDidChangeSelection).toBeCalledTimes(1);
    const elements: Array<string | lspTypes.SymbolInformation> = [symbols[0]];
    await treeMock.onDidChangeSelection.mock.calls[0][0](elements);

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
        "path": "fileURI1",
        "state": undefined,
        "title": "fileURI1",
      }
    `);
    expect(provider.getTreeItem(symbols[0])).toMatchInlineSnapshot(`
      MockTreeItem {
        "descriptiveText": "String",
        "image": "Symbol_String",
        "state": Symbol(TreeItemCollapsibleState.None),
        "title": "symbol1",
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
      onDidChangeSelection: jest.fn(),
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
    const treeMock = TreeViewTypedMock.mock.results[0].value;
    expect(treeMock.onDidChangeSelection).toBeCalledTimes(1);
    const elements: Array<string | lspTypes.Location> = [locations[0]];
    await treeMock.onDidChangeSelection.mock.calls[0][0](elements);

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
        "path": "fileURI1",
        "state": undefined,
        "title": "fileURI1",
      }
      `);
    expect(provider.getTreeItem(locations[0])).toMatchInlineSnapshot(`
      MockTreeItem {
        "state": Symbol(TreeItemCollapsibleState.None),
        "title": "name",
      }
    `);
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
])("disposes of subsequently created trees", (a, b) => {
  a();
  expect(TreeView).toHaveBeenCalledTimes(1);
  expect(TreeView).toHaveBeenCalledWith(
    "apexskier.typescript.sidebar.symbols",
    expect.anything()
  );
  expect(nova.workspace.showInformativeMessage).not.toBeCalled();
  const treeMock1 = TreeViewTypedMock.mock.results[0].value;
  expect(treeMock1.dispose).not.toBeCalled();

  b();
  expect(TreeView).toHaveBeenCalledTimes(2);
  const treeMock2 = TreeViewTypedMock.mock.results[1].value;
  expect(treeMock1.dispose).toBeCalled();
  expect(treeMock2.dispose).not.toBeCalled();
});
