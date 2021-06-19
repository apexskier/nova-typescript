import type * as lspTypes from "vscode-languageserver-protocol";
import * as applyWorkspaceEditModule from "../applyWorkspaceEdit";
import { registerRename } from "./rename";

jest.mock("../applyWorkspaceEdit");

describe("rename command", () => {
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
        showInputPalette: jest.fn((prompt, options, callback) =>
          callback("newName")
        ),
        openFile: jest.fn().mockReturnValue(Promise.resolve(mockEditor)),
      },
    });

    mockEditor.edit.mockClear();
    mockEditor.scrollToCursorPosition.mockClear();
    mockEditor.selectWordsContainingCursors.mockClear();
  });

  const mockEditor = {
    selectedRange: {
      start: 0,
      end: 0,
    },
    selectedText: "selectedText",
    document: {
      uri: "currentDocURI",
      getTextInRange() {
        return "";
      },
      eol: "\n",
    },
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
      "apexskier.typescript.rename",
      expect.any(Function)
    );
    const command = (nova.commands.register as jest.Mock).mock.calls[0][1];
    (nova.commands.register as jest.Mock).mockClear();
    return command;
  }

  it("selects the full symbol selected, then asks for a new name, then applies edits, then returns to original place", async () => {
    const response: lspTypes.WorkspaceEdit = {};
    const mockLanguageClient = {
      sendRequest: jest.fn().mockReturnValueOnce(response),
    };
    nova.workspace.showInputPalette = jest.fn(
      // eslint-disable-next-line no-unused-vars
      (prompt, options, callback: (value: string) => void) => {
        expect(options?.placeholder).toBe("selectedText");
        callback("newName");
      }
    ) as typeof nova.workspace.showInputPalette;
    const command = getCommand(
      mockLanguageClient as any as LanguageClient,
      registerRename
    );
    await command(mockEditor);

    expect(nova.workspace.showInputPalette).toHaveBeenCalledTimes(1);
    expect(mockLanguageClient.sendRequest).toHaveBeenNthCalledWith(
      1,
      "textDocument/rename",
      {
        newName: "newName",
        position: {
          character: 0,
          line: 0,
        },
        textDocument: {
          uri: "currentDocURI",
        },
      }
    );
    expect(applyWorkspaceEditModule.applyWorkspaceEdit).toBeCalledTimes(1);
    expect(nova.workspace.openFile).toBeCalledWith(mockEditor.document.uri);
    expect(mockEditor.scrollToCursorPosition).toBeCalledTimes(1);
  });

  it("warns if the symbol can't be renamed", async () => {
    const mockLanguageClient = {
      sendRequest: jest.fn().mockReturnValueOnce(Promise.resolve(null)),
    };
    const command = getCommand(
      mockLanguageClient as any as LanguageClient,
      registerRename
    );
    await command(mockEditor);

    expect(nova.workspace.showWarningMessage).toBeCalledTimes(1);
    expect(nova.workspace.showWarningMessage).toHaveBeenCalledWith(
      "Couldn't rename symbol."
    );
  });

  describe("bails if", () => {
    const mockLanguageClient = {
      sendRequest: jest.fn().mockReturnValueOnce(Promise.resolve(null)),
    };

    afterEach(() => {
      expect(mockLanguageClient.sendRequest).toBeCalledTimes(0);
    });

    it("no new name is provided", async () => {
      nova.workspace.showInputPalette = jest.fn(
        // eslint-disable-next-line no-unused-vars
        (prompt, options, callback: (value: string) => void) => {
          expect(options?.placeholder).toBe("selectedText");
          callback("");
        }
      ) as typeof nova.workspace.showInputPalette;
      const command = getCommand(
        mockLanguageClient as any as LanguageClient,
        registerRename
      );
      await command(mockEditor);
    });

    it("the same name is provided", async () => {
      nova.workspace.showInputPalette = jest.fn(
        // eslint-disable-next-line no-unused-vars
        (prompt, options, callback: (value: string) => void) => {
          expect(options?.placeholder).toBe("selectedText");
          callback("selectedText");
        }
      ) as typeof nova.workspace.showInputPalette;
      const command = getCommand(
        mockLanguageClient as any as LanguageClient,
        registerRename
      );
      await command(mockEditor);
    });
  });
});
