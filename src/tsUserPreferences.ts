import type { UserPreferences } from "typescript/lib/protocol";

function reload() {
  nova.commands.invoke("apexskier.typescript.reload");
}

// eslint-disable-next-line no-unused-vars
const keys: {
  [key in keyof UserPreferences]: UserPreferences[key] extends
    | boolean
    | undefined
    ? "boolean"
    : UserPreferences[key] extends string | undefined
    ? "string"
    : never;
} & Record<keyof UserPreferences, string> = {
  allowIncompleteCompletions: "boolean",
  allowRenameOfImportPath: "boolean",
  allowTextChangesInNewFiles: "boolean",
  disableSuggestions: "boolean",
  displayPartsForJSDoc: "boolean",
  generateReturnInDocTemplate: "boolean",
  importModuleSpecifierEnding: "string",
  importModuleSpecifierPreference: "string",
  includeAutomaticOptionalChainCompletions: "boolean",
  includeCompletionsForImportStatements: "boolean",
  includeCompletionsForModuleExports: "boolean",
  includeCompletionsWithClassMemberSnippets: "boolean",
  includeCompletionsWithInsertText: "boolean",
  includeCompletionsWithObjectLiteralMethodSnippets: "boolean",
  includeCompletionsWithSnippetText: "boolean",
  includeInlayEnumMemberValueHints: "boolean",
  includeInlayFunctionLikeReturnTypeHints: "boolean",
  includeInlayFunctionParameterTypeHints: "boolean",
  includeInlayParameterNameHints: "string",
  includeInlayParameterNameHintsWhenArgumentMatchesName: "boolean",
  includeInlayPropertyDeclarationTypeHints: "boolean",
  includeInlayVariableTypeHints: "boolean",
  includePackageJsonAutoImports: "string",
  jsxAttributeCompletionStyle: "string",
  lazyConfiguredProjectsFromExternalProject: "boolean",
  providePrefixAndSuffixTextForRename: "boolean",
  provideRefactorNotApplicableReason: "boolean",
  quotePreference: "string",
  useLabelDetailsInCompletionEntries: "boolean",
};

export function setupUserPreferences(): Disposable {
  const disposable = new CompositeDisposable();
  for (const key in keys) {
    const configKey = `apexskier.typescript.config.userPreferences.${key}`;
    disposable.add(nova.config.onDidChange(configKey, reload));
    disposable.add(nova.workspace.config.onDidChange(configKey, reload));
  }
  return disposable;
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export function getUserPreferences(): UserPreferences {
  const preferences: Mutable<UserPreferences> = {};
  Object.entries;
  for (const _key in keys) {
    const key = _key as keyof typeof keys;
    const configKey = `apexskier.typescript.config.userPreferences.${key}`;
    const configType = keys[key];
    const value =
      nova.workspace.config.get(configKey, configType as any) ??
      nova.config.get(configKey, configType as any) ??
      (undefined as UserPreferences[typeof key]);
    preferences[key] = value as any;
  }
  return preferences;
}
