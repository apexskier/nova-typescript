// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import { applyWorkspaceEdit } from "../applyWorkspaceEdit";
import { wrapCommand } from "../novaUtils";
import { rangeToLspRange } from "../lspNovaConversions";

// @Panic: this is totally decoupled from typescript, so it could totally be native to Nova

export function registerRename(client: LanguageClient) {
  return nova.commands.register(
    "apexskier.typescript.rename",
    wrapCommand(rename)
  );

  async function rename(editor: TextEditor) {
    // Select full word. It will be shown in a palette so the user can review it
    editor.selectWordsContainingCursors();

    const selectedRange = editor.selectedRange;
    const selectedPosition = rangeToLspRange(editor.document, selectedRange)
      ?.start;
    if (!selectedPosition) {
      nova.workspace.showErrorMessage(
        "Couldn't figure out what you've selected."
      );
      return;
    }

    const newName = await new Promise<string | null>((resolve) => {
      nova.workspace.showInputPalette(
        "New name for symbol",
        { placeholder: editor.selectedText },
        resolve
      );
    });
    if (!newName || newName == editor.selectedText) {
      return;
    }

    const params: lspTypes.RenameParams = {
      textDocument: { uri: editor.document.uri },
      position: selectedPosition,
      newName,
    };
    const response = (await client.sendRequest(
      "textDocument/rename",
      params
    )) as lspTypes.WorkspaceEdit | null;
    if (response == null) {
      nova.workspace.showWarningMessage("Couldn't rename symbol.");
      return;
    }
    await applyWorkspaceEdit(response);

    // go back to original document
    await nova.workspace.openFile(editor.document.uri);
    editor.scrollToCursorPosition();
  }
}
