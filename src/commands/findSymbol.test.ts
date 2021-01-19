// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import * as searchResultsModule from "../searchResults";
import { registerFindSymbol } from "./findSymbol";

jest.mock("../searchResults");

describe("findSymbol command", () => {
  beforeEach(() => {
    (global as any).nova = Object.assign(nova, {
      commands: {
        register: jest.fn(),
      },
      workspace: {
        showErrorMessage(err: Error) {
          throw err;
        },
      },
    });
  });

  function getCommand(
    languageClient: LanguageClient,
    // eslint-disable-next-line no-unused-vars
    register: (client: LanguageClient) => Disposable
    // eslint-disable-next-line no-unused-vars
  ): (...args: Array<any>) => Promise<void> {
    register(languageClient);
    expect(nova.commands.register).toHaveBeenCalledWith(
      "apexskier.typescript.findSymbol",
      expect.any(Function)
    );
    const command = (nova.commands.register as jest.Mock).mock.calls[0][1];
    (nova.commands.register as jest.Mock).mockClear();
    return command;
  }

  it("noop if no symbol searched for", async () => {
    const mockLanguageClient = {};
    const mockWorkspace = {
      showInputPalette: jest.fn((prompt, options, callback) => callback("")),
    };
    const command = getCommand(
      (mockLanguageClient as any) as LanguageClient,
      registerFindSymbol
    );
    await command(mockWorkspace);

    expect(mockWorkspace.showInputPalette).toHaveBeenCalledTimes(1);
  });

  it("warns if symbol can't be found", async () => {
    const mockWorkspace = {
      showInputPalette: jest.fn((prompt, options, callback) =>
        callback("symbol")
      ),
      showWarningMessage: jest.fn(),
    };
    const mockLanguageClient = {
      sendRequest: jest.fn().mockReturnValueOnce(Promise.resolve(null)),
    };
    const command = getCommand(
      (mockLanguageClient as any) as LanguageClient,
      registerFindSymbol
    );
    await command(mockWorkspace);

    expect(mockWorkspace.showWarningMessage).toBeCalledTimes(1);
    expect(mockWorkspace.showWarningMessage).toHaveBeenCalledWith(
      "Couldn't find symbol."
    );
  });

  it("finds symbol", async () => {
    const mockWorkspace = {
      showInputPalette: jest.fn((prompt, options, callback) =>
        callback("symbol")
      ),
    };
    const results: lspTypes.SymbolInformation[] = [
      {
        name: "result",
        kind: 1,
        location: {
          uri: "fileURI",
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
        },
      },
    ];
    const mockLanguageClient = {
      sendRequest: jest.fn().mockReturnValueOnce(Promise.resolve(results)),
    };
    const command = getCommand(
      (mockLanguageClient as any) as LanguageClient,
      registerFindSymbol
    );
    await command(mockWorkspace);

    expect(mockLanguageClient.sendRequest).toHaveBeenNthCalledWith(
      1,
      "workspace/symbol",
      { query: "symbol" }
    );
    expect(searchResultsModule.createSymbolSearchResultsTree).toBeCalledWith(
      results
    );
  });
});
