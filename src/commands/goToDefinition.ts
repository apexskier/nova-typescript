// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import * as lsp from "vscode-languageserver-types";
import { wrapCommand, openFile } from "../novaUtils";
import {
  rangeToLspRange,
  isLspLocationArray,
  lspRangeToRange,
} from "../lspNovaConversions";
import { createLocationSearchResultsTree } from "../searchResults";

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

    async function showRangeInEditor(
      _editor: TextEditor,
      range: lspTypes.Range
    ) {
      const novaRange = lspRangeToRange(_editor.document, range);
      _editor.addSelectionForRange(novaRange);
      _editor.scrollToPosition(novaRange.start);
    }

    async function showLocation(uri: string, range: lspTypes.Range) {
      if (uri === editor.document.uri) {
        showRangeInEditor(editor, range);
      } else {
        const newEditor = await openFile(uri);
        if (!newEditor) {
          nova.workspace.showWarningMessage(`Failed to open ${uri}`);
          return;
        }
        showRangeInEditor(newEditor, range);
      }
    }

    async function handleLocation(location: lspTypes.Location) {
      showLocation(location.uri, location.range);
    }

    async function handleLocationLink(location: lspTypes.LocationLink) {
      showLocation(location.targetUri, location.targetSelectionRange);
    }

    if (!isArray<lspTypes.Location | lspTypes.LocationLink>(response)) {
      handleLocation(response);
    } else if (response.length === 0) {
      nova.workspace.showWarningMessage("Couldn't find definition.");
      return;
    } else if (response.length === 1) {
      if (lsp.Location.is(response[0])) {
        handleLocation(response[0]);
      } else {
        handleLocationLink(response[0]);
      }
    } else {
      if (isLspLocationArray(response)) {
        createLocationSearchResultsTree(editor.selectedText, response);
        response.forEach(handleLocation);
      } else {
        createLocationSearchResultsTree(
          editor.selectedText,
          response.map<lspTypes.Location>((r) => ({
            uri: r.targetUri,
            range: r.targetSelectionRange,
          }))
        );
        response.forEach(handleLocationLink);
      }
    }
  }
}
