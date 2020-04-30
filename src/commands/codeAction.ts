// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import * as lsp from "vscode-languageserver-types";
import { applyWorkspaceEdit } from "../applyWorkspaceEdit";
import { wrapCommand } from "../novaUtils";
import { rangeToLspRange } from "../lspNovaConversions";

// @Panic: this is totally decoupled from typescript, so it could totally be native to Nova

export function registerCodeAction(client: LanguageClient) {
  return nova.commands.register(
    "apexskier.typescript.codeAction",
    wrapCommand(codeAction)
  );

  async function codeAction(editor: TextEditor) {
    console.log("apexskier.typescript.codeAction");

    const selectedRange = editor.selectedRange;
    const selectedLspRange = rangeToLspRange(editor.document, selectedRange);
    if (!selectedLspRange) {
      nova.workspace.showErrorMessage(
        "Couldn't figure out what you've selected."
      );
      return;
    }

    console.log(JSON.stringify(selectedLspRange));

    const params: lspTypes.CodeActionParams = {
      textDocument: { uri: editor.document.uri },
      range: selectedLspRange,
      context: {
        diagnostics: [], // TODO: Diagnostics are sent to the client from the service, but aren't exposed from nova
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

    const choiceIndex = await new Promise<number | null>((resolve) =>
      nova.workspace.showChoicePalette(
        response.map((c) => c.title),
        { placeholder: "Choose an action" },
        (_, index) => resolve(index)
      )
    );
    if (choiceIndex == null) {
      return;
    }
    const choice = response[choiceIndex];
    console.log(JSON.stringify(choice));
    if (lsp.Command.is(choice)) {
      const response = await executeCommand(client, choice);
      console.log(JSON.stringify(response));
    } else {
      if (choice.edit) {
        await applyWorkspaceEdit(choice.edit);
      }
      // TODO: CodeAction should likely save files before executing commands
      if (choice.command) {
        const response = await executeCommand(client, choice.command);
        console.log(JSON.stringify(response));
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
