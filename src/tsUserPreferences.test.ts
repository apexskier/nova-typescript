import { setupUserPreferences, getUserPreferences } from "./tsUserPreferences";

(global as any).nova = Object.assign(nova, {
  commands: {
    register: jest.fn(),
    invoke: jest.fn(),
  },
  config: {
    onDidChange: jest.fn(),
    ["get"]: jest.fn(),
  },
  workspace: {
    config: { onDidChange: jest.fn(), ["get"]: jest.fn() },
  },
});

describe("tsUserPreferences", () => {
  beforeEach(() => {
    (nova.workspace.config.get as jest.Mock).mockReset();
    (nova.config.get as jest.Mock).mockReset();
  });

  describe("reloads extension when any preferences change", () => {
    it("globally and for the workspace", () => {
      (global as any).CompositeDisposable = jest.fn(() => ({
        add: jest.fn(),
      }));

      setupUserPreferences();

      expect(nova.config.onDidChange).toBeCalledTimes(17);
      expect(nova.workspace.config.onDidChange).toBeCalledTimes(17);

      const globalConfigKeys = (
        nova.config.onDidChange as jest.Mock
      ).mock.calls.map(([key]) => key);
      const workspaceConfigKeys = (
        nova.workspace.config.onDidChange as jest.Mock
      ).mock.calls.map(([key]) => key);
      expect(globalConfigKeys).toEqual(workspaceConfigKeys);
      expect(globalConfigKeys).toMatchInlineSnapshot(`
        Array [
          "apexskier.typescript.config.userPreferences.disableSuggestions",
          "apexskier.typescript.config.userPreferences.quotePreference",
          "apexskier.typescript.config.userPreferences.includeCompletionsForModuleExports",
          "apexskier.typescript.config.userPreferences.includeCompletionsForImportStatements",
          "apexskier.typescript.config.userPreferences.includeCompletionsWithSnippetText",
          "apexskier.typescript.config.userPreferences.includeCompletionsWithInsertText",
          "apexskier.typescript.config.userPreferences.includeAutomaticOptionalChainCompletions",
          "apexskier.typescript.config.userPreferences.importModuleSpecifierPreference",
          "apexskier.typescript.config.userPreferences.importModuleSpecifierEnding",
          "apexskier.typescript.config.userPreferences.allowTextChangesInNewFiles",
          "apexskier.typescript.config.userPreferences.lazyConfiguredProjectsFromExternalProject",
          "apexskier.typescript.config.userPreferences.providePrefixAndSuffixTextForRename",
          "apexskier.typescript.config.userPreferences.provideRefactorNotApplicableReason",
          "apexskier.typescript.config.userPreferences.allowRenameOfImportPath",
          "apexskier.typescript.config.userPreferences.includePackageJsonAutoImports",
          "apexskier.typescript.config.userPreferences.displayPartsForJSDoc",
          "apexskier.typescript.config.userPreferences.generateReturnInDocTemplate",
        ]
      `);

      // same function
      const onChange = (nova.workspace.config.onDidChange as jest.Mock).mock
        .calls[0][1];
      for (const [, cb] of [
        ...(nova.config.onDidChange as jest.Mock).mock.calls,
        ...(nova.workspace.config.onDidChange as jest.Mock).mock.calls,
      ]) {
        expect(onChange).toBe(cb);
      }
    });

    it("by calling the reload command", () => {
      const reload = (nova.config.onDidChange as jest.Mock).mock.calls[0][1];
      reload();
      expect(nova.commands.invoke).toBeCalledTimes(1);
      expect(nova.commands.invoke).toBeCalledWith(
        "apexskier.typescript.reload"
      );
    });
  });

  describe("gets user preferences", () => {
    test("returns an empty object by default", () => {
      expect(getUserPreferences()).toEqual({});
    });

    test("returns global preferences", () => {
      (nova.config.get as jest.Mock).mockImplementation(
        (key, type) => `global ${key} ${type}`
      );
      expect(getUserPreferences()).toMatchInlineSnapshot(`
        Object {
          "allowRenameOfImportPath": "global apexskier.typescript.config.userPreferences.allowRenameOfImportPath boolean",
          "allowTextChangesInNewFiles": "global apexskier.typescript.config.userPreferences.allowTextChangesInNewFiles boolean",
          "disableSuggestions": "global apexskier.typescript.config.userPreferences.disableSuggestions boolean",
          "displayPartsForJSDoc": "global apexskier.typescript.config.userPreferences.displayPartsForJSDoc boolean",
          "generateReturnInDocTemplate": "global apexskier.typescript.config.userPreferences.generateReturnInDocTemplate boolean",
          "importModuleSpecifierEnding": "global apexskier.typescript.config.userPreferences.importModuleSpecifierEnding string",
          "importModuleSpecifierPreference": "global apexskier.typescript.config.userPreferences.importModuleSpecifierPreference string",
          "includeAutomaticOptionalChainCompletions": "global apexskier.typescript.config.userPreferences.includeAutomaticOptionalChainCompletions boolean",
          "includeCompletionsForImportStatements": "global apexskier.typescript.config.userPreferences.includeCompletionsForImportStatements boolean",
          "includeCompletionsForModuleExports": "global apexskier.typescript.config.userPreferences.includeCompletionsForModuleExports boolean",
          "includeCompletionsWithInsertText": "global apexskier.typescript.config.userPreferences.includeCompletionsWithInsertText boolean",
          "includeCompletionsWithSnippetText": "global apexskier.typescript.config.userPreferences.includeCompletionsWithSnippetText boolean",
          "includePackageJsonAutoImports": "global apexskier.typescript.config.userPreferences.includePackageJsonAutoImports string",
          "lazyConfiguredProjectsFromExternalProject": "global apexskier.typescript.config.userPreferences.lazyConfiguredProjectsFromExternalProject boolean",
          "providePrefixAndSuffixTextForRename": "global apexskier.typescript.config.userPreferences.providePrefixAndSuffixTextForRename boolean",
          "provideRefactorNotApplicableReason": "global apexskier.typescript.config.userPreferences.provideRefactorNotApplicableReason boolean",
          "quotePreference": "global apexskier.typescript.config.userPreferences.quotePreference string",
        }
      `);
    });

    test("returns workspace preferences", () => {
      (nova.config.get as jest.Mock).mockImplementation(
        (key, type) => `global ${key} ${type}`
      );
      (nova.workspace.config.get as jest.Mock).mockImplementation(
        (key, type) => `workspace ${key} ${type}`
      );
      expect(getUserPreferences()).toMatchInlineSnapshot(`
        Object {
          "allowRenameOfImportPath": "workspace apexskier.typescript.config.userPreferences.allowRenameOfImportPath boolean",
          "allowTextChangesInNewFiles": "workspace apexskier.typescript.config.userPreferences.allowTextChangesInNewFiles boolean",
          "disableSuggestions": "workspace apexskier.typescript.config.userPreferences.disableSuggestions boolean",
          "displayPartsForJSDoc": "workspace apexskier.typescript.config.userPreferences.displayPartsForJSDoc boolean",
          "generateReturnInDocTemplate": "workspace apexskier.typescript.config.userPreferences.generateReturnInDocTemplate boolean",
          "importModuleSpecifierEnding": "workspace apexskier.typescript.config.userPreferences.importModuleSpecifierEnding string",
          "importModuleSpecifierPreference": "workspace apexskier.typescript.config.userPreferences.importModuleSpecifierPreference string",
          "includeAutomaticOptionalChainCompletions": "workspace apexskier.typescript.config.userPreferences.includeAutomaticOptionalChainCompletions boolean",
          "includeCompletionsForImportStatements": "workspace apexskier.typescript.config.userPreferences.includeCompletionsForImportStatements boolean",
          "includeCompletionsForModuleExports": "workspace apexskier.typescript.config.userPreferences.includeCompletionsForModuleExports boolean",
          "includeCompletionsWithInsertText": "workspace apexskier.typescript.config.userPreferences.includeCompletionsWithInsertText boolean",
          "includeCompletionsWithSnippetText": "workspace apexskier.typescript.config.userPreferences.includeCompletionsWithSnippetText boolean",
          "includePackageJsonAutoImports": "workspace apexskier.typescript.config.userPreferences.includePackageJsonAutoImports string",
          "lazyConfiguredProjectsFromExternalProject": "workspace apexskier.typescript.config.userPreferences.lazyConfiguredProjectsFromExternalProject boolean",
          "providePrefixAndSuffixTextForRename": "workspace apexskier.typescript.config.userPreferences.providePrefixAndSuffixTextForRename boolean",
          "provideRefactorNotApplicableReason": "workspace apexskier.typescript.config.userPreferences.provideRefactorNotApplicableReason boolean",
          "quotePreference": "workspace apexskier.typescript.config.userPreferences.quotePreference string",
        }
      `);
    });
  });
});
