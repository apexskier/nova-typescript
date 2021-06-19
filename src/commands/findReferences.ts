import type * as lspTypes from "vscode-languageserver-protocol";
import { wrapCommand } from "../novaUtils";
import { rangeToLspRange } from "../lspNovaConversions";
import { createLocationSearchResultsTree } from "../searchResults";

// @Panic: this is totally decoupled from typescript, so it could totally be native to Nova

export function registerFindReferences(client: LanguageClient) {
  return nova.commands.register(
    "apexskier.typescript.findReferences",
    wrapCommand(findReferences)
  );

  async function findReferences(editor: TextEditor) {
    const selectedRange = editor.selectedRange;
    const selectedText = editor.selectedText;
    const selectedPosition = rangeToLspRange(
      editor.document,
      selectedRange
    )?.start;
    if (!selectedPosition) {
      nova.workspace.showWarningMessage(
        "Couldn't figure out what you've selected."
      );
      return;
    }
    const params: lspTypes.ReferenceParams = {
      textDocument: { uri: editor.document.uri },
      position: selectedPosition,
      context: {
        includeDeclaration: true,
      },
    };
    const response = (await client.sendRequest(
      "textDocument/references",
      params
    )) as lspTypes.Location[] | null;
    if (response == null) {
      nova.workspace.showInformativeMessage("Couldn't find references.");
      return;
    }

    createLocationSearchResultsTree(selectedText, response);
  }
}
