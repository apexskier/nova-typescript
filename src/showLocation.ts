// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import * as lsp from "vscode-languageserver-types";
import { openFile } from "./novaUtils";
import { lspRangeToRange } from "./lspNovaConversions";

async function showRangeInEditor(editor: TextEditor, range: lspTypes.Range) {
  const novaRange = lspRangeToRange(editor.document, range);
  editor.addSelectionForRange(novaRange);
  editor.scrollToPosition(novaRange.start);
}

async function showRangeInUri(uri: string, range: lspTypes.Range) {
  const newEditor = await openFile(uri);
  if (!newEditor) {
    nova.workspace.showWarningMessage(`Failed to open ${uri}`);
    return;
  }
  showRangeInEditor(newEditor, range);
}

export async function showLocation(
  location: lspTypes.Location | lspTypes.LocationLink
) {
  if (lsp.Location.is(location)) {
    showRangeInUri(location.uri, location.range);
  } else {
    showRangeInUri(location.targetUri, location.targetSelectionRange);
  }
}
