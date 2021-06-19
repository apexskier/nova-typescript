import type * as lspTypes from "vscode-languageserver-protocol";
import { applyLSPEdits } from "../applyLSPEdits";
import { wrapCommand } from "../novaUtils";

export function registerFormatDocument(client: LanguageClient) {
  return nova.commands.register(
    "apexskier.typescript.commands.formatDocument",
    wrapCommand(formatDocument)
  );

  // eslint-disable-next-line no-unused-vars
  async function formatDocument(editor: TextEditor): Promise<void>;
  async function formatDocument(
    // eslint-disable-next-line no-unused-vars
    workspace: Workspace,
    // eslint-disable-next-line no-unused-vars
    editor: TextEditor
  ): Promise<void>;
  async function formatDocument(
    editorOrWorkspace: TextEditor | Workspace,
    maybeEditor?: TextEditor
  ) {
    const editor: TextEditor = maybeEditor ?? (editorOrWorkspace as TextEditor);

    const documentFormatting: lspTypes.DocumentFormattingParams = {
      textDocument: { uri: editor.document.uri },
      options: {
        insertSpaces: editor.softTabs,
        tabSize: editor.tabLength,
      },
    };
    const changes = (await client.sendRequest(
      "textDocument/formatting",
      documentFormatting
    )) as null | Array<lspTypes.TextEdit>;

    if (!changes) {
      return;
    }

    applyLSPEdits(editor, changes);
  }
}
