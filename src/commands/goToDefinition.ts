// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import * as lsp from "vscode-languageserver-types";
import { wrapCommand } from "../novaUtils";
import { rangeToLspRange, isLspLocationArray } from "../lspNovaConversions";
import { createLocationSearchResultsTree } from "../searchResults";
import { showLocation } from "../showLocation";

// @Panic: this is totally decoupled from typescript, so it could totally be native to Nova

function isArray<T>(x: Array<T> | T): x is Array<T> {
  return Array.isArray(x);
}

export function registerGoToDefinition(client: LanguageClient) {
  return nova.commands.register(
    "apexskier.typescript.goToDefinition",
    wrapCommand(goToDefinition)
  );

  async function goToDefinition(editor: TextEditor) {
    console.log("apexskier.typescript.goToDefinition");

    const selectedRange = editor.selectedRange;
    const selectedPosition = rangeToLspRange(editor.document, selectedRange)
      ?.start;
    if (!selectedPosition) {
      nova.workspace.showWarningMessage(
        "Couldn't figure out what you've selected."
      );
      return;
    }
    const definitionParams: lspTypes.TypeDefinitionParams = {
      textDocument: { uri: editor.document.uri },
      position: selectedPosition,
    };
    const response = (await client.sendRequest(
      "textDocument/definition",
      definitionParams
    )) as
      | lspTypes.Location
      | lspTypes.Location[]
      | lspTypes.LocationLink[]
      | null;
    if (response == null) {
      nova.workspace.showWarningMessage("Couldn't find definition.");
      return;
    }

    if (!isArray<lspTypes.Location | lspTypes.LocationLink>(response)) {
      showLocation(response);
    } else if (response.length === 0) {
      nova.workspace.showWarningMessage("Couldn't find definition.");
      return;
    } else if (response.length === 1) {
      if (lsp.Location.is(response[0])) {
        showLocation(response[0]);
      } else {
        showLocation(response[0]);
      }
    } else {
      if (isLspLocationArray(response)) {
        createLocationSearchResultsTree(editor.selectedText, response);
        response.forEach(showLocation);
      } else {
        createLocationSearchResultsTree(
          editor.selectedText,
          response.map<lspTypes.Location>((r) => ({
            uri: r.targetUri,
            range: r.targetSelectionRange,
          }))
        );
        response.forEach(showLocation);
      }
    }
  }
}
