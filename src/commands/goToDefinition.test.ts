// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import { registerGoToDefinition } from "./goToDefinition";
import * as searchResultsModule from "../searchResults";
import * as showLocationModule from "../showLocation";

jest.mock("../searchResults");
jest.mock("../showLocation");

function resetModuleMock(m: { [key: string]: unknown }) {
  for (const key in m) {
    if (key === "__esModule") {
      continue;
    }
    (m[key] as jest.Mock).mockClear();
  }
}

describe("goToDefinition command", () => {
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

    resetModuleMock(searchResultsModule);
    resetModuleMock(showLocationModule);
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
      "apexskier.typescript.goToDefinition",
      expect.any(Function)
    );
    const command = (nova.commands.register as jest.Mock).mock.calls[0][1];
    (nova.commands.register as jest.Mock).mockClear();
    return command;
  }

  const mockLanguageClient = {
    sendRequest: jest.fn(),
  };

  afterEach(() => {
    expect(mockLanguageClient.sendRequest).toHaveBeenNthCalledWith(
      1,
      "textDocument/definition",
      expect.anything()
    );
    mockLanguageClient.sendRequest.mockReset();
  });

  describe("warns if definition can't be found", () => {
    afterEach(() => {
      expect(nova.workspace.showWarningMessage).toBeCalledTimes(1);
      expect(nova.workspace.showWarningMessage).toHaveBeenCalledWith(
        "Couldn't find definition."
      );
    });

    it("warns if definition can't be found", async () => {
      mockLanguageClient.sendRequest.mockReturnValueOnce(Promise.resolve(null));
      const command = getCommand(
        (mockLanguageClient as any) as LanguageClient,
        registerGoToDefinition
      );
      await command(mockEditor);
    });

    it("warns if no definitions found", async () => {
      const result: lspTypes.Location[] = [];
      mockLanguageClient.sendRequest.mockReturnValueOnce(
        Promise.resolve(result)
      );
      const command = getCommand(
        (mockLanguageClient as any) as LanguageClient,
        registerGoToDefinition
      );
      await command(mockEditor);
    });
  });

  describe("finds and opens single results", () => {
    it("Location", async () => {
      const result: lspTypes.Location = {
        uri: "fileURI",
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
      };
      mockLanguageClient.sendRequest.mockReturnValueOnce(
        Promise.resolve(result)
      );
      const command = getCommand(
        (mockLanguageClient as any) as LanguageClient,
        registerGoToDefinition
      );
      await command(mockEditor);
      expect(showLocationModule.showLocation).toBeCalledWith(result);
    });

    it("Location array", async () => {
      const result: lspTypes.Location[] = [
        {
          uri: "fileURI",
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
        },
      ];
      mockLanguageClient.sendRequest.mockReturnValueOnce(
        Promise.resolve(result)
      );
      const command = getCommand(
        (mockLanguageClient as any) as LanguageClient,
        registerGoToDefinition
      );
      await command(mockEditor);
      expect(showLocationModule.showLocation).toBeCalledWith(result[0]);
    });

    it("LocationLink array", async () => {
      const result: lspTypes.LocationLink[] = [
        {
          targetUri: "fileURI",
          targetRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          targetSelectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
        },
      ];
      mockLanguageClient.sendRequest.mockReturnValueOnce(
        Promise.resolve(result)
      );
      const command = getCommand(
        (mockLanguageClient as any) as LanguageClient,
        registerGoToDefinition
      );
      await command(mockEditor);
      expect(showLocationModule.showLocation).toBeCalledWith(result[0]);
    });
  });

  describe("finds and opens multiple results in a search tree (sidebar) and in the editor", () => {
    it("Location", async () => {
      const results: lspTypes.Location[] = [
        {
          uri: "fileURI",
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
        },
        {
          uri: "fileURI2",
          range: {
            start: { line: 1, character: 1 },
            end: { line: 1, character: 1 },
          },
        },
      ];
      mockLanguageClient.sendRequest.mockReturnValueOnce(
        Promise.resolve(results)
      );
      const command = getCommand(
        (mockLanguageClient as any) as LanguageClient,
        registerGoToDefinition
      );
      await command(mockEditor);
      expect(showLocationModule.showLocation).toBeCalledTimes(results.length);
      results.forEach((result, i) => {
        expect(showLocationModule.showLocation).toHaveBeenNthCalledWith(
          i + 1,
          result,
          i, // this uses forEach, which is why these second args are here
          results
        );
      });
    });

    it("LocationLink", async () => {
      const results: lspTypes.LocationLink[] = [
        {
          targetUri: "fileURI",
          targetRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          targetSelectionRange: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
        },
        {
          targetUri: "fileURI2",
          targetRange: {
            start: { line: 1, character: 1 },
            end: { line: 1, character: 1 },
          },
          targetSelectionRange: {
            start: { line: 1, character: 1 },
            end: { line: 1, character: 1 },
          },
        },
      ];
      mockLanguageClient.sendRequest.mockReturnValueOnce(
        Promise.resolve(results)
      );
      const command = getCommand(
        (mockLanguageClient as any) as LanguageClient,
        registerGoToDefinition
      );
      await command(mockEditor);
      expect(showLocationModule.showLocation).toBeCalledTimes(results.length);
      results.forEach((result, i) => {
        expect(showLocationModule.showLocation).toHaveBeenNthCalledWith(
          i + 1,
          result,
          i, // this uses forEach, which is why these second args are here
          results
        );
      });
    });
  });
});
