// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import { wrapCommand } from "../novaUtils";
import { rangeToLspRange } from "../lspNovaConversions";

// @Panic: this is totally decoupled from typescript, so it could totally be native to Nova

export function registerSignatureHelp(client: LanguageClient) {
  return nova.commands.register(
    "apexskier.typescript.signatureHelp",
    wrapCommand(signatureHelp)
  );

  async function signatureHelp(editor: TextEditor) {
    const selectedRange = editor.selectedRange;
    const selectedPosition = rangeToLspRange(editor.document, selectedRange)
      ?.start;
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
        triggerKind: 2, // TriggerCharacter, Invoked doesn't work here
        isRetrigger: false,
      },
    };
    console.log("params", JSON.stringify(params));
    const response = (await client.sendRequest(
      "textDocument/signatureHelp",
      params
    )) as lspTypes.SignatureHelp | null;
    console.log("response", JSON.stringify(response));

    // This resolves, but doesn't seem to ever provide help

    if (response == null) {
      nova.workspace.showInformativeMessage("Couldn't find signature help.");
      return;
    }

    if (nova.inDevMode()) {
      console.log(JSON.stringify(response));
    }

    function stringifyDocs(doc: string | lspTypes.MarkupContent) {
      if (typeof doc == "string") {
        return doc;
      } else {
        // NOTE: this doesn't do any correct rendering
        return doc.value;
      }
    }
    const content =
      response.signatures
        .filter((s) => s.documentation)
        .map((s) => `${s.label}\n${stringifyDocs(s.documentation!)}`)
        .join("\n\n")
        .trim() || response.signatures[response.activeSignature ?? 0].label;

    nova.workspace.showInformativeMessage(content);
  }
}
