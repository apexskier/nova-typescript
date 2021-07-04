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
} &
  Record<keyof UserPreferences, string> = {
  disableSuggestions: "boolean",
  quotePreference: "string",
  includeCompletionsForModuleExports: "boolean",
  includeCompletionsForImportStatements: "boolean",
  includeCompletionsWithSnippetText: "boolean",
  includeCompletionsWithInsertText: "boolean",
  includeAutomaticOptionalChainCompletions: "boolean",
  importModuleSpecifierPreference: "string",
  importModuleSpecifierEnding: "string",
  allowTextChangesInNewFiles: "boolean",
  lazyConfiguredProjectsFromExternalProject: "boolean",
  providePrefixAndSuffixTextForRename: "boolean",
  provideRefactorNotApplicableReason: "boolean",
  allowRenameOfImportPath: "boolean",
  includePackageJsonAutoImports: "string",
  displayPartsForJSDoc: "boolean",
  generateReturnInDocTemplate: "boolean",
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
