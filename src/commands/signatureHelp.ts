import type * as lspTypes from "vscode-languageserver-protocol";
import { rangeToLspRange } from "../lspNovaConversions";
import { wrapCommand } from "../novaUtils";

// @Panic: this is totally decoupled from typescript, so it could totally be native to Nova

function render(content: string | lspTypes.MarkupContent) {
  if (typeof content === "string") {
    return content;
  }
  return content.value;
}

export function registerSignatureHelp(client: LanguageClient) {
  return nova.commands.register(
    "apexskier.typescript.signatureHelp",
    wrapCommand(signatureHelp)
  );

  async function signatureHelp(editor: TextEditor) {
    const selectedRange = editor.selectedRange;
    const selectedPosition = rangeToLspRange(
      editor.document,
      selectedRange
    )?.start;
    if (!selectedPosition) {
      nova.workspace.showWarningMessage(
        "Couldn't figure out what you've selected."
      );
      return;
    }
    const params: lspTypes.SignatureHelpParams = {
      textDocument: { uri: editor.document.uri },
      position: selectedPosition,
      context: {
        triggerKind: 1, // Invoked
        isRetrigger: false,
      },
    };
    const response = (await client.sendRequest(
      "textDocument/signatureHelp",
      params
    )) as lspTypes.SignatureHelp | null;

    if (nova.inDevMode()) {
      console.log(JSON.stringify(response));
    }

    // This resolves, but doesn't work often.
    // it seemed to be working at one point...

    if (response == null || response.activeSignature == null) {
      nova.workspace.showInformativeMessage("Couldn't find documentation.");
      return;
    }

    const signature = response.signatures[response.activeSignature];

    let message = signature.label;
    if (signature.documentation) {
      message += `

${render(signature.documentation)}`;
    }

    nova.workspace.showInformativeMessage(message);
  }
}
