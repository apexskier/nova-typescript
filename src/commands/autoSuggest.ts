// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import { asyncNova } from "nova-extension-utils";
import { rangeToLspRange, lspRangeToRange } from "../lspNovaConversions";
import { wrapCommand } from "../novaUtils";
import { executeCommand } from "./codeAction";

export function registerAutoSuggest(client: LanguageClient) {
  // TODO: in future this could use "client/registerCapability" to add more functionlity, if the language server supports

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
    const response = (await client.sendRequest(
      "textDocument/completion",
      params
    )) as lspTypes.CompletionItem[] | lspTypes.CompletionList | null;
    if (!response) {
      nova.workspace.showInformativeMessage("No completions found.");
      return;
    }

    // NOTE: isIncomplete isn't handled here
    const items = (Array.isArray(response)
      ? response
      : response.items
    ).sort((a, b) =>
      (a.sortText ?? a.label).localeCompare(b.sortText ?? b.label)
    );
    if (!items.length) {
      nova.workspace.showInformativeMessage("No completions found.");
      return;
    }

    let choice = await asyncNova.showChoicePalette(
      items,
      (item) => `${item.label}${item.detail ? `- ${item.detail}` : ""}`,
      { placeholder: "suggestions" }
    );
    if (!choice) {
      return;
    }

    choice = (await client.sendRequest(
      "completionItem/resolve",
      choice
    )) as lspTypes.CompletionItem;

    if (nova.inDevMode()) {
      console.log(JSON.stringify(choice, null, "  "));
    }

    const { textEdit, additionalTextEdits, command } = choice;
    if (textEdit) {
      await editor.edit((textEditorEdit) => {
        const range = lspRangeToRange(editor.document, textEdit.range);
        textEditorEdit.replace(range, textEdit.newText);
      });
    } else {
      await editor.insert(choice.insertText ?? choice.label);
    }
    if (command) {
      await executeCommand(client, command);
    }
    if (additionalTextEdits) {
      await editor.edit((textEditorEdit) => {
        for (const edit of additionalTextEdits.reverse()) {
          const range = lspRangeToRange(editor.document, edit.range);
          textEditorEdit.replace(range, edit.newText);
        }
      });
    }
  }
}
