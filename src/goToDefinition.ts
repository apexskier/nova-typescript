import type * as lspTypes from "vscode-languageserver-protocol";
import * as lsp from "vscode-languageserver-types";

function rangeToPosition(
  document: TextDocument,
  range: Range
): lspTypes.Position | null {
  const fullContents = document.getTextInRange(new Range(0, document.length));
  let chars = 0;
  const lines = fullContents.split(document.eol);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const lineLength = lines[lineIndex].length + document.eol.length;
    if (chars + lineLength >= range.start) {
      // console.log(lines[lineIndex]);
      const character = range.start - chars;
      // console.log(new Array(character).fill(" ").join("") + "↑")
      return { line: lineIndex, character };
    }
    chars += lineLength;
  }
  return null;
}

function isArray<T>(x: Array<T> | T): x is Array<T> {
  return Array.isArray(x);
}

// this could really use some tests
function lspRangeToRange(document: TextDocument, range: lspTypes.Range): Range {
  const fullContents = document.getTextInRange(new Range(0, document.length));
  let rangeStart = 0;
  let rangeEnd = 0;
  let chars = 0;
  const lines = fullContents.split(document.eol);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const lineLength = lines[lineIndex].length + document.eol.length;
    if (range.start.line === lineIndex) {
      rangeStart = chars + range.start.character;
    }
    if (range.end.line === lineIndex) {
      rangeEnd = chars + range.end.character;
      break;
    }
    chars += lineLength;
  }
  return new Range(rangeStart, rangeEnd);
}

function isLspLocationArray(
  x: Array<lspTypes.Location> | Array<lspTypes.LocationLink>
): x is Array<lspTypes.Location> {
  return lsp.Location.is(x[0]);
}

export function registerGoToDefinition(client: LanguageClient) {
  nova.commands.register(
    "apexskier.typescript.goToDefinition",
    async (editor: TextEditor) => {
      console.log("apexskier.typescript.goToDefinition");

      const selectedRange = editor.selectedRange;
      const selectedPosition = rangeToPosition(editor.document, selectedRange);
      if (!selectedPosition) {
        nova.workspace.showErrorMessage("Couldn't figure out what to show.");
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
        nova.workspace.showErrorMessage("Couldn't find definition.");
        return;
      }

      async function handleRangeInEditor(
        _editor: TextEditor,
        range: lspTypes.Range
      ) {
        _editor.addSelectionForRange(lspRangeToRange(_editor.document, range));
      }

      async function handleLocation(location: lspTypes.Location) {
        console.log("Location");
        if (location.uri === editor.document.uri) {
          handleRangeInEditor(editor, location.range);
        } else {
          let newEditor = await nova.workspace.openFile(location.uri);
          console.log(newEditor);
          if (!newEditor) {
            console.log("trying to reopen");
            // try one more time, this doesn't resolve if the file isn't already open. Need to file a bug
            newEditor = await nova.workspace.openFile(location.uri);
            console.log(newEditor);
            if (!newEditor) {
              nova.workspace.showErrorMessage(`Failed to open ${location.uri}`);
              return;
            }
          }
          handleRangeInEditor(newEditor, location.range);
        }
      }

      async function handleLocationLink(location: lspTypes.LocationLink) {
        console.log("LocationLink");
        if (location.targetUri === editor.document.uri) {
          handleRangeInEditor(editor, location.targetSelectionRange);
        } else {
          const newEditor = await nova.workspace.openFile(location.targetUri);
          console.log(newEditor);
          if (!newEditor) {
            nova.workspace.showErrorMessage(
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
  );
}
