import type * as lspTypes from "vscode-languageserver-protocol";
import {
  rangeToLspRange,
  wrapCommand,
  openFile,
  lspRangeToRange,
} from "./utils";

// @Panic: this is totally decoupled from typescript, so it could totally be native to Nova

export function registerRename(client: LanguageClient) {
  return nova.commands.register(
    "apexskier.typescript.rename",
    wrapCommand(rename)
  );

  async function rename(editor: TextEditor) {
    console.log("apexskier.typescript.rename");

    // Select full word. It will be showed in a palette so the user can review it
    editor.selectWordsContainingCursors();

    const selectedRange = editor.selectedRange;
    const selectedPosition = rangeToLspRange(editor.document, selectedRange)
      ?.start;
    if (!selectedPosition) {
      nova.workspace.showErrorMessage("Couldn't figure out what to show.");
      return;
    }

    const newName = await new Promise<string | null>((resolve) => {
      nova.workspace.showInputPalette(
        "New name for symbol",
        { placeholder: editor.selectedText },
        resolve
      );
    });
    if (!newName) {
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
    nova.workspace.openFile(editor.document.uri);
    editor.scrollToCursorPosition();
  }
}

async function applyWorkspaceEdit(workspaceEdit: lspTypes.WorkspaceEdit) {
  if (!workspaceEdit.changes) {
    return;
  }
  // this could be parallelized
  for (const uri in workspaceEdit.changes) {
    const changes = workspaceEdit.changes[uri];

    const editor = await openFile(uri);
    if (!editor) {
      nova.workspace.showWarningMessage(`Failed to open ${uri}`);
      continue;
    }
    editor.edit((textEditorEdit) => {
      for (const change of changes.reverse()) {
        const range = lspRangeToRange(editor.document, change.range);
        textEditorEdit.replace(range, change.newText);
      }
    });
  }
}
