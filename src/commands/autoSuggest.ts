// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import * as lsp from "vscode-languageserver-types";
import { rangeToLspRange } from "../lspNovaConversions";
import { wrapCommand, showChoicePalette } from "../novaUtils";

export function registerAutoSuggest(client: LanguageClient) {
  const compositeDisposable = new CompositeDisposable();
  compositeDisposable.add(
    nova.commands.register(
      "apexskier.typescript.autoSuggest",
      wrapCommand(autoSuggest)
    )
  );

  // this isn't being called at all
  const completionAssistant: CompletionAssistant = {
    provideCompletionItems(editor, context) {
      console.log("providing suggestions", editor.document.uri);
      return [];
      // return await autoSuggest(editor) ?? []
    },
  };
  compositeDisposable.add(
    nova.assistants.registerCompletionAssistant("*", completionAssistant)
  );
  // compositeDisposable.add(nova.assistants.registerCompletionAssistant("javascript", completionAssistant));
  // compositeDisposable.add(nova.assistants.registerCompletionAssistant("typescript", completionAssistant));
  // compositeDisposable.add(nova.assistants.registerCompletionAssistant("jsx", completionAssistant));
  // compositeDisposable.add(nova.assistants.registerCompletionAssistant("tsx", completionAssistant));

  return compositeDisposable;

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

    items.map((item) => {
      const completionItem = new CompletionItem(
        item.label,
        lspToNovaCompletionKind(item.kind ?? lsp.CompletionItemKind.Value)
      );
      completionItem.documentation =
        typeof item.documentation == "string"
          ? item.documentation
          : item.documentation?.value;
      // TODO: fill out the completion item more
      return completionItem;
    });
  }
}

function lspToNovaCompletionKind(
  kind: lspTypes.CompletionItemKind
): CompletionItemKind {
  switch (kind) {
    case lsp.CompletionItemKind.Class:
      return CompletionItemKind.Class;
    case lsp.CompletionItemKind.Color:
      return CompletionItemKind.Color;
    case lsp.CompletionItemKind.Constant:
      return CompletionItemKind.Constant;
    case lsp.CompletionItemKind.Constructor:
      return CompletionItemKind.Constructor;
    case lsp.CompletionItemKind.Enum:
      return CompletionItemKind.Enum;
    case lsp.CompletionItemKind.EnumMember:
      return CompletionItemKind.EnumMember;
    case lsp.CompletionItemKind.Event:
      return CompletionItemKind.Variable; // fallback
    case lsp.CompletionItemKind.Field:
      return CompletionItemKind.Property; // fallback
    case lsp.CompletionItemKind.File:
      return CompletionItemKind.File;
    case lsp.CompletionItemKind.Folder:
      return CompletionItemKind.File; // fallback?
    case lsp.CompletionItemKind.Function:
      return CompletionItemKind.Function;
    case lsp.CompletionItemKind.Interface:
      return CompletionItemKind.Interface;
    case lsp.CompletionItemKind.Keyword:
      return CompletionItemKind.Keyword;
    case lsp.CompletionItemKind.Method:
      return CompletionItemKind.Method;
    case lsp.CompletionItemKind.Module:
      return CompletionItemKind.Keyword; // fallback?
    case lsp.CompletionItemKind.Operator:
      return CompletionItemKind.Keyword; // fallback?
    case lsp.CompletionItemKind.Property:
      return CompletionItemKind.Property;
    case lsp.CompletionItemKind.Reference:
      return CompletionItemKind.Reference;
    case lsp.CompletionItemKind.Snippet:
      return CompletionItemKind.Keyword; // fallback?
    case lsp.CompletionItemKind.Struct:
      return CompletionItemKind.Struct;
    case lsp.CompletionItemKind.Text:
      return CompletionItemKind.Keyword; // fallback?
    case lsp.CompletionItemKind.TypeParameter:
      return CompletionItemKind.Type; // fallback?
    case lsp.CompletionItemKind.Unit:
      return CompletionItemKind.Keyword; // fallback?
    case lsp.CompletionItemKind.Value:
      return CompletionItemKind.Expression; // fallback?
    case lsp.CompletionItemKind.Variable:
      return CompletionItemKind.Variable;
  }
}
