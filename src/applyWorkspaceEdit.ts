// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import { openFile } from "./novaUtils";
import { lspRangeToRange } from "./lspNovaConversions";

export async function applyWorkspaceEdit(
  workspaceEdit: lspTypes.WorkspaceEdit
) {
  // TODO: support .documentChanges in applyWorkspaceEdit
  if (!workspaceEdit.changes) {
    return;
  }
  // this could be parallelized
  for (const uri in workspaceEdit.changes) {
    const changes = workspaceEdit.changes[uri];
    if (!changes.length) {
      continue;
    }
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
