// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import { registerAutoSuggest } from "./autoSuggest";

describe.only("autoSuggest command", () => {
  beforeEach(() => {
    (global as any).nova = Object.assign(nova, {
      commands: {
        register: jest.fn(),
      },
      workspace: {
        showChoicePalette: jest.fn(),
        showErrorMessage(err: Error) {
          throw err;
        },
        showInformativeMessage: jest.fn(),
        openFile: jest.fn().mockReturnValue(Promise.resolve(mockEditor)),
      },
    });

    mockEditor.edit.mockClear();
  });

  const mockEditor = {
    selectedRange: {
      start: 0,
      end: 0,
    },
    document: {
      getTextInRange() {
        return "";
      },
      eol: "\n",
    },
    edit: jest.fn(),
    insert: jest.fn(),
  };

  function getCommand(
    languageClient: LanguageClient,
    register: (client: LanguageClient) => Disposable
  ): (...args: Array<any>) => Promise<void> {
    register(languageClient);
    expect(nova.commands.register).toHaveBeenCalledWith(
      "apexskier.typescript.autoSuggest",
      expect.any(Function)
    );
    const command = (nova.commands.register as jest.Mock).mock.calls[0][1];
    (nova.commands.register as jest.Mock).mockClear();
    return command;
  }

  it("notifies if no completions are available", async () => {
    const mockLanguageClient = {
      sendRequest: jest.fn().mockReturnValueOnce(Promise.resolve(null)),
    };
    const command = getCommand(
      (mockLanguageClient as any) as LanguageClient,
      registerAutoSuggest
    );
    await command(mockEditor);

    expect(nova.workspace.showInformativeMessage).toBeCalledTimes(1);
    expect(nova.workspace.showInformativeMessage).toHaveBeenCalledWith(
      "No completions found."
    );
  });

  it("applies a suggestion if chosen", async () => {
    (nova.workspace
      .showChoicePalette as jest.Mock) = jest
      .fn()
      .mockImplementationOnce((a, b, cb) => {
        cb(null, 0);
      });
    (nova.workspace
      .showActionPanel as jest.Mock) = jest
      .fn()
      .mockImplementationOnce((a, b, cb) => {
        cb(0);
      });
    const suggestion: lspTypes.CompletionItem = { label: "suggestion" };
    const resolvedSuggestion: lspTypes.CompletionItem = {
      ...suggestion,
      documentation: "suggestion documentation",
      textEdit: {
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
        newText: "newText",
      },
      additionalTextEdits: [
        {
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          newText: "additionalNewText",
        },
      ],
      command: { title: "Command", command: "command/command" },
    };
    const mockLanguageClient = {
      sendRequest: jest
        .fn()
        .mockReturnValueOnce(Promise.resolve([suggestion]))
        .mockReturnValueOnce(Promise.resolve(resolvedSuggestion)),
    };
    const command = getCommand(
      (mockLanguageClient as any) as LanguageClient,
      registerAutoSuggest
    );
    await command(mockEditor);

    expect(nova.workspace.showChoicePalette).toBeCalledTimes(1);
  });
});
