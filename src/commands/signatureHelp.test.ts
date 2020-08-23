// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import { registerSignatureHelp } from "./signatureHelp";

describe("signatureHelp command", () => {
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
      },
    });
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
  };

  function getCommand(
    languageClient: LanguageClient,
    register: (client: LanguageClient) => Disposable
  ): (...args: Array<any>) => Promise<void> {
    register(languageClient);
    expect(nova.commands.register).toHaveBeenCalledWith(
      "apexskier.typescript.signatureHelp",
      expect.any(Function)
    );
    const command = (nova.commands.register as jest.Mock).mock.calls[0][1];
    (nova.commands.register as jest.Mock).mockClear();
    return command;
  }

  it("warns if no signature help is available", async () => {
    const mockLanguageClient = {
      sendRequest: jest.fn().mockReturnValueOnce(Promise.resolve(null)),
    };
    const command = getCommand(
      (mockLanguageClient as any) as LanguageClient,
      registerSignatureHelp
    );
    await command(mockEditor);

    expect(nova.workspace.showInformativeMessage).toBeCalledTimes(1);
    expect(nova.workspace.showInformativeMessage).toHaveBeenCalledWith(
      "Couldn't find signature help."
    );
  });
});
