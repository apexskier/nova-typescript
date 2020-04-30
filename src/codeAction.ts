import type * as lspTypes from "vscode-languageserver-protocol";
import { rangeToLspRange, wrapCommand } from "./utils";

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
      nova.workspace.showErrorMessage("Couldn't figure out what to show.");
      return;
    }

    console.log(JSON.stringify(selectedLspRange));

    const params: lspTypes.CodeActionParams = {
      textDocument: { uri: editor.document.uri },
      range: selectedLspRange,
      context: {
        diagnostics: [],
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
  }
}
