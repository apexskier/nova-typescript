import type * as lspTypes from "vscode-languageserver-protocol";
import * as lsp from "vscode-languageserver-types";
import {
  rangeToLspRange,
  lspRangeToRange,
  isArray,
  isLspLocationArray,
  wrapCommand,
  openFile,
} from "./utils";

// @Panic: this is totally decoupled from typescript, so it could totally be native to Nova

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
      nova.workspace.showWarningMessage("Couldn't figure out what to show.");
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

    async function handleRangeInEditor(
      _editor: TextEditor,
      range: lspTypes.Range
    ) {
      const novaRange = lspRangeToRange(_editor.document, range);
      _editor.addSelectionForRange(novaRange);
      _editor.scrollToPosition(novaRange.start);
    }

    // TODO: If there's more than one result, show that somehow

    async function handleLocation(location: lspTypes.Location) {
      if (location.uri === editor.document.uri) {
        handleRangeInEditor(editor, location.range);
      } else {
        const newEditor = await openFile(location.uri);
        if (!newEditor) {
          nova.workspace.showWarningMessage(`Failed to open ${location.uri}`);
          return;
        }
        handleRangeInEditor(newEditor, location.range);
      }
    }

    async function handleLocationLink(location: lspTypes.LocationLink) {
      if (location.targetUri === editor.document.uri) {
        handleRangeInEditor(editor, location.targetSelectionRange);
      } else {
        const newEditor = await openFile(location.targetUri);
        if (!newEditor) {
          nova.workspace.showWarningMessage(
            `Failed to open ${location.targetUri}`
          );
          return;
        }
        handleRangeInEditor(newEditor, location.targetSelectionRange);
      }
    }

    console.log(JSON.stringify(response));

    if (!isArray<lspTypes.Location | lspTypes.LocationLink>(response)) {
      handleLocation(response);
    } else if (response.length === 1) {
      if (lsp.Location.is(response[0])) {
        handleLocation(response[0]);
      } else {
        handleLocationLink(response[0]);
      }
    } else {
      if (isLspLocationArray(response)) {
        response.forEach(handleLocation);
      } else {
        response.forEach(handleLocationLink);
      }
    }
  }
}
