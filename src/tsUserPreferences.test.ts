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

      expect(nova.config.onDidChange).toBeCalledTimes(29);
      expect(nova.workspace.config.onDidChange).toBeCalledTimes(29);

      const globalConfigKeys = (
        nova.config.onDidChange as jest.Mock
      ).mock.calls.map(([key]) => key);
      const workspaceConfigKeys = (
        nova.workspace.config.onDidChange as jest.Mock
      ).mock.calls.map(([key]) => key);
      expect(globalConfigKeys).toEqual(workspaceConfigKeys);
      expect(globalConfigKeys).toMatchInlineSnapshot(`
        Array [
          "apexskier.typescript.config.userPreferences.allowIncompleteCompletions",
          "apexskier.typescript.config.userPreferences.allowRenameOfImportPath",
          "apexskier.typescript.config.userPreferences.allowTextChangesInNewFiles",
          "apexskier.typescript.config.userPreferences.disableSuggestions",
          "apexskier.typescript.config.userPreferences.displayPartsForJSDoc",
          "apexskier.typescript.config.userPreferences.generateReturnInDocTemplate",
          "apexskier.typescript.config.userPreferences.importModuleSpecifierEnding",
          "apexskier.typescript.config.userPreferences.importModuleSpecifierPreference",
          "apexskier.typescript.config.userPreferences.includeAutomaticOptionalChainCompletions",
          "apexskier.typescript.config.userPreferences.includeCompletionsForImportStatements",
          "apexskier.typescript.config.userPreferences.includeCompletionsForModuleExports",
          "apexskier.typescript.config.userPreferences.includeCompletionsWithClassMemberSnippets",
          "apexskier.typescript.config.userPreferences.includeCompletionsWithInsertText",
          "apexskier.typescript.config.userPreferences.includeCompletionsWithObjectLiteralMethodSnippets",
          "apexskier.typescript.config.userPreferences.includeCompletionsWithSnippetText",
          "apexskier.typescript.config.userPreferences.includeInlayEnumMemberValueHints",
          "apexskier.typescript.config.userPreferences.includeInlayFunctionLikeReturnTypeHints",
          "apexskier.typescript.config.userPreferences.includeInlayFunctionParameterTypeHints",
          "apexskier.typescript.config.userPreferences.includeInlayParameterNameHints",
          "apexskier.typescript.config.userPreferences.includeInlayParameterNameHintsWhenArgumentMatchesName",
          "apexskier.typescript.config.userPreferences.includeInlayPropertyDeclarationTypeHints",
          "apexskier.typescript.config.userPreferences.includeInlayVariableTypeHints",
          "apexskier.typescript.config.userPreferences.includePackageJsonAutoImports",
          "apexskier.typescript.config.userPreferences.jsxAttributeCompletionStyle",
          "apexskier.typescript.config.userPreferences.lazyConfiguredProjectsFromExternalProject",
          "apexskier.typescript.config.userPreferences.providePrefixAndSuffixTextForRename",
          "apexskier.typescript.config.userPreferences.provideRefactorNotApplicableReason",
          "apexskier.typescript.config.userPreferences.quotePreference",
          "apexskier.typescript.config.userPreferences.useLabelDetailsInCompletionEntries",
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
          "allowIncompleteCompletions": "global apexskier.typescript.config.userPreferences.allowIncompleteCompletions boolean",
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
          "includeCompletionsWithClassMemberSnippets": "global apexskier.typescript.config.userPreferences.includeCompletionsWithClassMemberSnippets boolean",
          "includeCompletionsWithInsertText": "global apexskier.typescript.config.userPreferences.includeCompletionsWithInsertText boolean",
          "includeCompletionsWithObjectLiteralMethodSnippets": "global apexskier.typescript.config.userPreferences.includeCompletionsWithObjectLiteralMethodSnippets boolean",
          "includeCompletionsWithSnippetText": "global apexskier.typescript.config.userPreferences.includeCompletionsWithSnippetText boolean",
          "includeInlayEnumMemberValueHints": "global apexskier.typescript.config.userPreferences.includeInlayEnumMemberValueHints boolean",
          "includeInlayFunctionLikeReturnTypeHints": "global apexskier.typescript.config.userPreferences.includeInlayFunctionLikeReturnTypeHints boolean",
          "includeInlayFunctionParameterTypeHints": "global apexskier.typescript.config.userPreferences.includeInlayFunctionParameterTypeHints boolean",
          "includeInlayParameterNameHints": "global apexskier.typescript.config.userPreferences.includeInlayParameterNameHints string",
          "includeInlayParameterNameHintsWhenArgumentMatchesName": "global apexskier.typescript.config.userPreferences.includeInlayParameterNameHintsWhenArgumentMatchesName boolean",
          "includeInlayPropertyDeclarationTypeHints": "global apexskier.typescript.config.userPreferences.includeInlayPropertyDeclarationTypeHints boolean",
          "includeInlayVariableTypeHints": "global apexskier.typescript.config.userPreferences.includeInlayVariableTypeHints boolean",
          "includePackageJsonAutoImports": "global apexskier.typescript.config.userPreferences.includePackageJsonAutoImports string",
          "jsxAttributeCompletionStyle": "global apexskier.typescript.config.userPreferences.jsxAttributeCompletionStyle string",
          "lazyConfiguredProjectsFromExternalProject": "global apexskier.typescript.config.userPreferences.lazyConfiguredProjectsFromExternalProject boolean",
          "providePrefixAndSuffixTextForRename": "global apexskier.typescript.config.userPreferences.providePrefixAndSuffixTextForRename boolean",
          "provideRefactorNotApplicableReason": "global apexskier.typescript.config.userPreferences.provideRefactorNotApplicableReason boolean",
          "quotePreference": "global apexskier.typescript.config.userPreferences.quotePreference string",
          "useLabelDetailsInCompletionEntries": "global apexskier.typescript.config.userPreferences.useLabelDetailsInCompletionEntries boolean",
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
          "allowIncompleteCompletions": "workspace apexskier.typescript.config.userPreferences.allowIncompleteCompletions boolean",
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
          "includeCompletionsWithClassMemberSnippets": "workspace apexskier.typescript.config.userPreferences.includeCompletionsWithClassMemberSnippets boolean",
          "includeCompletionsWithInsertText": "workspace apexskier.typescript.config.userPreferences.includeCompletionsWithInsertText boolean",
          "includeCompletionsWithObjectLiteralMethodSnippets": "workspace apexskier.typescript.config.userPreferences.includeCompletionsWithObjectLiteralMethodSnippets boolean",
          "includeCompletionsWithSnippetText": "workspace apexskier.typescript.config.userPreferences.includeCompletionsWithSnippetText boolean",
          "includeInlayEnumMemberValueHints": "workspace apexskier.typescript.config.userPreferences.includeInlayEnumMemberValueHints boolean",
          "includeInlayFunctionLikeReturnTypeHints": "workspace apexskier.typescript.config.userPreferences.includeInlayFunctionLikeReturnTypeHints boolean",
          "includeInlayFunctionParameterTypeHints": "workspace apexskier.typescript.config.userPreferences.includeInlayFunctionParameterTypeHints boolean",
          "includeInlayParameterNameHints": "workspace apexskier.typescript.config.userPreferences.includeInlayParameterNameHints string",
          "includeInlayParameterNameHintsWhenArgumentMatchesName": "workspace apexskier.typescript.config.userPreferences.includeInlayParameterNameHintsWhenArgumentMatchesName boolean",
          "includeInlayPropertyDeclarationTypeHints": "workspace apexskier.typescript.config.userPreferences.includeInlayPropertyDeclarationTypeHints boolean",
          "includeInlayVariableTypeHints": "workspace apexskier.typescript.config.userPreferences.includeInlayVariableTypeHints boolean",
          "includePackageJsonAutoImports": "workspace apexskier.typescript.config.userPreferences.includePackageJsonAutoImports string",
          "jsxAttributeCompletionStyle": "workspace apexskier.typescript.config.userPreferences.jsxAttributeCompletionStyle string",
          "lazyConfiguredProjectsFromExternalProject": "workspace apexskier.typescript.config.userPreferences.lazyConfiguredProjectsFromExternalProject boolean",
          "providePrefixAndSuffixTextForRename": "workspace apexskier.typescript.config.userPreferences.providePrefixAndSuffixTextForRename boolean",
          "provideRefactorNotApplicableReason": "workspace apexskier.typescript.config.userPreferences.provideRefactorNotApplicableReason boolean",
          "quotePreference": "workspace apexskier.typescript.config.userPreferences.quotePreference string",
          "useLabelDetailsInCompletionEntries": "workspace apexskier.typescript.config.userPreferences.useLabelDetailsInCompletionEntries boolean",
        }
      `);
    });
  });
});
