import { registerOrganizeImports } from "./organizeImports";

class MockRange {
  // eslint-disable-next-line no-unused-vars
  constructor(readonly start: number, readonly end: number) {}
}
(global as any).Range = MockRange;

jest.mock("../skipDestructiveOrganizeImports", () => ({
  skipDestructiveOrganizeImports: () => false,
}));

describe("organizeImports command", () => {
  beforeEach(() => {
    (global as any).nova = Object.assign(nova, {
      commands: {
        register: jest.fn(),
      },
      workspace: {
        showErrorMessage(err: Error) {
          throw err;
        },
        showWarningMessage: jest.fn(),
      },
    });

    mockEditor.edit.mockClear();
    mockEditor.scrollToCursorPosition.mockClear();
    mockEditor.selectWordsContainingCursors.mockClear();
  });

  const mockEditor = {
    selectedRanges: [new Range(2, 3)],
    selectedText: "selectedText",
    document: {
      length: 10,
      uri: "currentDocURI",
      path: "/path",
      getTextInRange() {
        return "";
      },
      eol: "\n",
    },
    softTabs: true,
    tabLength: 2,
    edit: jest.fn(),
    selectWordsContainingCursors: jest.fn(),
    scrollToCursorPosition: jest.fn(),
  };

  function getCommand(
    languageClient: LanguageClient,
    // eslint-disable-next-line no-unused-vars
    register: (client: LanguageClient) => Disposable
    // eslint-disable-next-line no-unused-vars
  ): (...args: Array<any>) => Promise<void> {
    register(languageClient);
    expect(nova.commands.register).toHaveBeenCalledWith(
      "apexskier.typescript.commands.organizeImports",
      expect.any(Function)
    );
    const command = (nova.commands.register as jest.Mock).mock.calls[0][1];
    (nova.commands.register as jest.Mock).mockClear();
    return command;
  }

  it("configures formatting with the server, asks the server to organize imports, then resets your selection", async () => {
    const mockLanguageClient = {
      sendRequest: jest.fn().mockImplementationOnce(() => {
        mockEditor.document.length = 14;
      }),
    };
    const command = getCommand(
      mockLanguageClient as any as LanguageClient,
      registerOrganizeImports
    );
    expect(mockEditor.selectedRanges).toEqual([new Range(2, 3)]);
    await command(mockEditor);

    expect(mockLanguageClient.sendRequest).toBeCalledTimes(2);
    expect(mockLanguageClient.sendRequest).toHaveBeenNthCalledWith(
      1,
      "textDocument/formatting",
      {
        textDocument: { uri: "currentDocURI" },
        options: {
          insertSpaces: true,
          tabSize: 2,
        },
      }
    );
    expect(mockLanguageClient.sendRequest).toHaveBeenNthCalledWith(
      2,
      "workspace/executeCommand",
      {
        arguments: ["/path", { skipDestructiveCodeActions: false }],
        command: "_typescript.organizeImports",
      }
    );
    expect(mockEditor.selectedRanges).toEqual([new Range(6, 7)]);
    expect(mockEditor.scrollToCursorPosition).toBeCalledTimes(1);
  });

  it("doesn't reset scroll to a negative value", async () => {
    const mockLanguageClient = {
      sendRequest: jest.fn().mockImplementationOnce(() => {
        mockEditor.document.length = 0;
      }),
    };
    const command = getCommand(
      mockLanguageClient as any as LanguageClient,
      registerOrganizeImports
    );
    await command(mockEditor);
    expect(mockEditor.selectedRanges).toEqual([new Range(0, 0)]);
    expect(mockEditor.scrollToCursorPosition).toBeCalledTimes(1);
  });

  it("warns if the document isn't saved", async () => {
    const mockLanguageClient = {
      sendRequest: jest.fn().mockReturnValueOnce(Promise.resolve(null)),
    };
    mockEditor.document.path = "";
    const command = getCommand(
      mockLanguageClient as any as LanguageClient,
      registerOrganizeImports
    );
    await command(mockEditor);

    expect(nova.workspace.showWarningMessage).toBeCalledTimes(1);
    expect(nova.workspace.showWarningMessage).toHaveBeenCalledWith(
      "Please save this document before organizing imports."
    );
  });
});
