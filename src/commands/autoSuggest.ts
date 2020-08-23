// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import { rangeToLspRange, lspRangeToRange } from "../lspNovaConversions";
import { wrapCommand, showChoicePalette } from "../novaUtils";
import { executeCommand } from "../commands/codeAction";

function render(content: string | lspTypes.MarkupContent) {
  if (typeof content === "string") {
    return content;
  }
  return content.value;
}

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
    const response = (await client.sendRequest(
      "textDocument/completion",
      params
    )) as lspTypes.CompletionItem[] | lspTypes.CompletionList | null;
    if (!response) {
      nova.workspace.showWarningMessage("No completions found.");
      return;
    }

    const items = (Array.isArray(response)
      ? response
      : response.items
    ).sort((a, b) =>
      (a.sortText ?? a.label).localeCompare(b.sortText ?? b.label)
    );

    await showChoices();

    async function showChoices() {
      const choice = await showChoicePalette(
        items,
        (item) => `${item.label}${item.detail ? `- ${item.detail}` : ""}`,
        { placeholder: "suggestions" }
      );
      if (!choice) {
        return;
      }

      const completionItem = (await client.sendRequest(
        "completionItem/resolve",
        choice
      )) as lspTypes.CompletionItem;

      const actions = {
        async Insert() {
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
        },
        Back: showChoices,
        Cancel() {
          return;
        },
      };
      let message = completionItem.label;
      if (completionItem.documentation) {
        message += `

${render(completionItem.documentation)}`;
      }
      if (completionItem.detail) {
        message += `

${completionItem.detail}`;
      }
      const action = await new Promise<keyof typeof actions>((resolve) => {
        const buttons: Array<keyof typeof actions> = [
          "Insert",
          "Back",
          "Cancel",
        ];
        nova.workspace.showActionPanel(message, { buttons }, (idx) => {
          if (idx == null) {
            resolve("Cancel");
          } else {
            resolve(buttons[idx]);
          }
        });
      });
      await actions[action]();
    }
  }
}
