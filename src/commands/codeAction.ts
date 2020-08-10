// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import * as lsp from "vscode-languageserver-types";
import { applyWorkspaceEdit } from "../applyWorkspaceEdit";
import { wrapCommand, showChoicePalette } from "../novaUtils";
import { rangeToLspRange } from "../lspNovaConversions";

// @Panic: this is totally decoupled from typescript, so it could totally be native to Nova

export function registerCodeAction(client: LanguageClient) {
  return nova.commands.register(
    "apexskier.typescript.codeAction",
    wrapCommand(codeAction)
  );

  async function codeAction(editor: TextEditor) {
    const selectedRange = editor.selectedRange;
    const selectedLspRange = rangeToLspRange(editor.document, selectedRange);
    if (!selectedLspRange) {
      nova.workspace.showErrorMessage(
        "Couldn't figure out what you've selected."
      );
      return;
    }

    const params: lspTypes.CodeActionParams = {
      textDocument: { uri: editor.document.uri },
      range: selectedLspRange,
      context: {
        diagnostics: [], // Diagnostics are sent to the client from the service, but aren't exposed from nova
      },
    };
    const response = (await client.sendRequest(
      "textDocument/codeAction",
      params
    )) as (lspTypes.Command | lspTypes.CodeAction)[] | null;
    if (response == null || response.length === 0) {
      nova.workspace.showInformativeMessage("No code actions available.");
      return;
    }

    const choice = await showChoicePalette(response, (c) => c.title, {
      placeholder: "Choose an action",
    });
    if (choice == null) {
      return;
    }

    if (lsp.Command.is(choice)) {
      await executeCommand(client, choice);
    } else {
      if (choice.edit) {
        await applyWorkspaceEdit(choice.edit);
      }
      if (choice.command) {
        await executeCommand(client, choice.command);
      }
    }
  }
}

// https://microsoft.github.io/language-server-protocol/specifications/specification-current/#workspace_executeCommand
// NOTE: this actually handled "externally" in the applyEdit command handler
async function executeCommand(
  client: LanguageClient,
  command: lspTypes.Command
) {
  console.info("executing command", command.command);
  const params: lspTypes.ExecuteCommandParams = {
    command: command.command,
    arguments: command.arguments,
  };
  return client.sendRequest("workspace/executeCommand", params) as any | null;
}
