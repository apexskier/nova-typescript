// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import { 
      wrapCommand } from "../novaUtils";

// NOTE: this is explicitly built for the typescript-language-server; it directly invokes the specific command it uses.
// In order to decouple and become LSP generic, we'd need to first send a code action request for only
// lspTypes.CodeActionKind.SourceOrganizeImports, then process the response's code action or commands.
// That would mean reimplementing that processing in the extension, which I don't like.
// Related conversation at https://devforum.nova.app/t/ability-to-send-lsp-messages-to-nova/466

export function registerOrganizeImports(client: LanguageClient) {
  return nova.commands.register(
    "apexskier.typescript.commands.organizeImports",
    wrapCommand(organizeImports)
  );

  // eslint-disable-next-line no-unused-vars
  async function organizeImports(editor: TextEditor): Promise<void>;
  async function organizeImports(
    // eslint-disable-next-line no-unused-vars
    workspace: Workspace,
    // eslint-disable-next-line no-unused-vars
    editor: TextEditor
  ): Promise<void>;
  async function organizeImports(
    editorOrWorkspace: TextEditor | Workspace,
    maybeEditor?: TextEditor
  ) {
    const editor: TextEditor = maybeEditor ?? (editorOrWorkspace as TextEditor);

    const originalSelections = editor.selectedRanges;
    const originalLength = editor.document.length;

    if (!editor.document.path) {
      nova.workspace.showWarningMessage(
        "Please save this document before organizing imports."
      );
      return;
    }
    
    // Ensure the language server is aware of the formatting settings for this editor
    // Normally this command is used to apply formatting, but we just skip applying
    // the response and rely on the server caching the formatting settings.
    const documentFormatting: lspTypes.DocumentFormattingParams = {
      textDocument: { uri: editor.document.uri },
      options: {
        insertSpaces: editor.softTabs,
        tabSize: editor.tabLength
      }
    }
    await client.sendRequest("textDocument/formatting", documentFormatting)

    const organizeImportsCommand: lspTypes.ExecuteCommandParams = {
      command: "_typescript.organizeImports",
      arguments: [editor.document.path],
    };
    await client.sendRequest(
      "workspace/executeCommand",
      organizeImportsCommand
    );

    // Move selection/cursor back to where it was
    // NOTE: this isn't fully perfect, since it doesn't know where the changes were made.
    // If your cursor is above the imports it won't be returned properly.
    // I'm okay with this for now. To fully fix it we'd need to do the import organization manually
    // based on an explicit code action, which isn't worth it.
    const newLength = editor.document.length;
    const lengthChange = originalLength - newLength;
    editor.selectedRanges = originalSelections.map(
      (r) =>
        new Range(
          Math.max(0, r.start - lengthChange),
          Math.max(0, r.end - lengthChange)
        )
    );
    editor.scrollToCursorPosition();
  }
}
