import { registerFormatDocument } from "./formatDocument";

class MockRange {
  // eslint-disable-next-line no-unused-vars
  constructor(readonly start: number, readonly end: number) {}
}
(global as any).Range = MockRange;

describe("formatDocument command", () => {
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
      "apexskier.typescript.commands.formatDocument",
      expect.any(Function)
    );
    const command = (nova.commands.register as jest.Mock).mock.calls[0][1];
    (nova.commands.register as jest.Mock).mockClear();
    return command;
  }

  it("applies changes from server to format document", async () => {
    const mockLanguageClient = {
      sendRequest: jest.fn().mockImplementationOnce(() => []),
    };
    const command = getCommand(
      mockLanguageClient as any as LanguageClient,
      registerFormatDocument
    );
    await command(mockEditor);

    expect(mockLanguageClient.sendRequest).toBeCalledTimes(1);
    expect(mockLanguageClient.sendRequest).toHaveBeenCalledWith(
      "textDocument/formatting",
      {
        textDocument: { uri: "currentDocURI" },
        options: {
          insertSpaces: true,
          tabSize: 2,
        },
      }
    );
    expect(mockEditor.edit).toBeCalledTimes(1);
  });
});
