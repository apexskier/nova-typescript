import type * as lspTypes from "vscode-languageserver-protocol";
import { lspRangeToRange } from "./lspNovaConversions";

export async function applyLSPEdits(
  editor: TextEditor,
  edits: Array<lspTypes.TextEdit>
) {
  editor.edit((textEditorEdit) => {
    for (const change of edits.reverse()) {
      const range = lspRangeToRange(editor.document, change.range);
      textEditorEdit.replace(range, change.newText);
    }
  });
}
