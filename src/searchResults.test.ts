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
});

describe("Location search results tree", () => {});
