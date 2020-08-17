// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import { registerCodeAction } from "./codeAction";

describe("codeAction command", () => {
  beforeEach(() => {
    (global as any).nova = Object.assign(nova, {
      commands: {
        register: jest.fn(),
      },
      workspace: {
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
  };

  function getCommand(
    languageClient: LanguageClient,
    register: (client: LanguageClient) => Disposable
  ): (...args: Array<any>) => Promise<void> {
    register(languageClient);
    expect(nova.commands.register).toHaveBeenCalledWith(
      "apexskier.typescript.codeAction",
      expect.any(Function)
    );
    const command = (nova.commands.register as jest.Mock).mock.calls[0][1];
    (nova.commands.register as jest.Mock).mockClear();
    return command;
  }

  it("warns if no code actions are available", async () => {
    const mockLanguageClient = {
      sendRequest: jest.fn().mockReturnValueOnce(Promise.resolve([])),
    };
    const command = getCommand(
      (mockLanguageClient as any) as LanguageClient,
      registerCodeAction
    );
    await command(mockEditor);

    expect(nova.workspace.showInformativeMessage).toBeCalledTimes(1);
    expect(nova.workspace.showInformativeMessage).toHaveBeenCalledWith(
      "No code actions available."
    );
  });

  describe("asks which action to choose, then", () => {
    const command: lspTypes.Command = {
      title: "Command1",
      command: "command1/command",
    };
    const codeAction: lspTypes.CodeAction = {
      title: "Action2",
      edit: {
        changes: {
          fileURI: [
            {
              range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 0 },
              },
              newText: "hello world",
            },
          ],
        },
      },
      command: { title: "Action2Command", command: "action2/command" },
    };
    const actions = [command, codeAction];

    it("executes the chosen command", async () => {
      (global as any).console.info = jest.fn();
      (global as any).nova.workspace.showChoicePalette = jest.fn(
        (choices, _, callback) => {
          expect(choices).toEqual(["Command1", "Action2"]);
          callback(null, 0);
        }
      );
      const mockLanguageClient = {
        sendRequest: jest
          .fn()
          .mockReturnValueOnce(Promise.resolve(actions))
          .mockReturnValueOnce(Promise.resolve("response")),
      };
      const command = getCommand(
        (mockLanguageClient as any) as LanguageClient,
        registerCodeAction
      );
      await command(mockEditor);

      expect(mockLanguageClient.sendRequest).toHaveBeenNthCalledWith(
        1,
        "textDocument/codeAction",
        expect.anything()
      );
      expect(nova.workspace.showChoicePalette).toBeCalledTimes(1);
      expect(mockLanguageClient.sendRequest).toHaveBeenNthCalledWith(
        2,
        "workspace/executeCommand",
        { arguments: undefined, command: "command1/command" }
      );
    });

    it("executes the chosen code action", async () => {
      (global as any).console.info = jest.fn();
      (global as any).nova.workspace.showChoicePalette = jest.fn(
        (choices, _, callback) => {
          expect(choices).toEqual(["Command1", "Action2"]);
          callback(null, 1);
        }
      );
      const mockLanguageClient = {
        sendRequest: jest
          .fn()
          .mockReturnValueOnce(Promise.resolve(actions))
          .mockReturnValueOnce(Promise.resolve("response")),
      };
      const command = getCommand(
        (mockLanguageClient as any) as LanguageClient,
        registerCodeAction
      );

      await command(mockEditor);

      expect(mockLanguageClient.sendRequest).toHaveBeenNthCalledWith(
        1,
        "textDocument/codeAction",
        expect.anything()
      );
      expect(nova.workspace.showChoicePalette).toBeCalledTimes(1);
      expect(nova.workspace.openFile).toHaveBeenCalledWith("fileURI");
      expect(mockEditor.edit).toHaveBeenCalledTimes(1);
      expect(mockLanguageClient.sendRequest).toHaveBeenNthCalledWith(
        2,
        "workspace/executeCommand",
        { arguments: undefined, command: "action2/command" }
      );
    });
  });
});
