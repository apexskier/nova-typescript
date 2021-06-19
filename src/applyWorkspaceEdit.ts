import type * as lspTypes from "vscode-languageserver-protocol";
import { applyLSPEdits } from "./applyLSPEdits";
import { openFile } from "./novaUtils";

// @Deprecated I want to replace this with a call to Nova's client with workspace/applyEdit, but that's currently not possible.
// I've requested this feature.
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

    applyLSPEdits(editor, changes);
  }
}
