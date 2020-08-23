// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import { rangeToLspRange } from "../lspNovaConversions";
import { wrapCommand, showChoicePalette } from "../novaUtils";

export function registerAutoSuggest(client: LanguageClient) {
  return nova.commands.register(
    "apexskier.typescript.autoSuggest",
    wrapCommand(autoSuggest)
  );

  async function autoSuggest(editor: TextEditor) {
    const selectedRange = editor.selectedRange;
    const selectedLspRange = rangeToLspRange(editor.document, selectedRange);
    if (!selectedLspRange) {
      nova.workspace.showErrorMessage(
        "Couldn't figure out what you've selected."
      );
      return;
    }

    const params: lspTypes.CompletionParams = {
      textDocument: { uri: editor.document.uri },
      position: selectedLspRange.end,
      context: {
        triggerKind: 1, // Invoked
      },
    };
    console.log("requesting completions");
    const response = (await client.sendRequest(
      "textDocument/completion",
      params
    )) as lspTypes.CompletionItem[] | lspTypes.CompletionList | null;
    if (!response) {
      nova.workspace.showWarningMessage("No completions found.");
      return;
    }

    // TODO: support partial results
    const items = (Array.isArray(response)
      ? response
      : response.items
    ).sort((a, b) =>
      (a.sortText ?? a.label).localeCompare(b.sortText ?? b.label)
    );

    const choice = await showChoicePalette(
      items,
      (item) => `${item.label}${item.detail ? `- ${item.detail}` : ""}`,
      { placeholder: "suggestions" }
    );
    if (!choice) {
      return;
    }
    editor.insert(choice.insertText ?? choice.label);
  }
}
