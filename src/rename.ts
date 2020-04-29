import type * as lspTypes from "vscode-languageserver-protocol";
import {
  rangeToPosition,
  wrapCommand,
  openFile,
  lspRangeToRange,
} from "./utils";

// @Panic: this is totally decoupled from typescript, so it could totally be native to Nova

export function registerRename(client: LanguageClient) {
  nova.commands.register("apexskier.typescript.rename", wrapCommand(rename));

  async function rename(editor: TextEditor) {
    console.log("apexskier.typescript.rename");
    
    editor.selectWordsContainingCursors();

    const selectedRange = editor.selectedRange;
    const selectedPosition = rangeToPosition(editor.document, selectedRange);
    if (!selectedPosition) {
      nova.workspace.showErrorMessage("Couldn't figure out what to show.");
      return;
    }

    const newName = await new Promise<string | null>((resolve, reject) => {
      nova.workspace.showInputPalette(
        "New name",
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
    console.log(JSON.stringify(response));
    await applyWorkspaceEdit(response);
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
