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
const TreeViewTypedMock: jest.Mock<TreeView<
  unknown
>> = jest.fn().mockImplementation(mockTreeViewImplementation);
const TreeViewMock: jest.Mock<Partial<TreeView<unknown>>> = TreeViewTypedMock;
(global as any).TreeView = TreeViewMock;

beforeEach(() => {
  (global as any).TreeView.mockClear();

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
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
      },
    },
    {
      name: "symbol2",
      kind: lsp.SymbolKind.Enum,
      location: {
        uri: "fileURI2",
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
      },
    },
  ];

  it("disposes of subsequently created trees", () => {
    createSymbolSearchResultsTree(symbols);
    expect(TreeView).toHaveBeenCalledTimes(1);
    expect(TreeView).toHaveBeenCalledWith(
      "apexskier.typescript.sidebar.symbols",
      expect.anything()
    );
    expect(nova.workspace.showInformativeMessage).not.toBeCalled();
    const treeMock1 = TreeViewTypedMock.mock.results[0].value;
    expect(treeMock1.dispose).not.toBeCalled();

    createSymbolSearchResultsTree(symbols);
    expect(TreeView).toHaveBeenCalledTimes(2);
    const treeMock2 = TreeViewTypedMock.mock.results[1].value;
    expect(treeMock1.dispose).toBeCalled();
    expect(treeMock2.dispose).not.toBeCalled();
  });

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
    const provider: TreeDataProvider<string | lspTypes.SymbolInformation> =
      TreeViewTypedMock.mock.calls[0][1].dataProvider;
    const treeMock = TreeViewTypedMock.mock.results[0].value;
    expect(treeMock.onDidChangeSelection).toBeCalledTimes(1);
    const elements: Array<string | lspTypes.SymbolInformation> = [symbols[0]];
    await treeMock.onDidChangeSelection.mock.calls[0][0](elements);
  });

  it("disposes of subsequently created trees", () => {
    createSymbolSearchResultsTree(symbols);
    const provider: TreeDataProvider<string | lspTypes.SymbolInformation> =
      TreeViewTypedMock.mock.calls[0][1].dataProvider;
  });
});

describe("Location search results tree", () => {});
