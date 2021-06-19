import type * as lspTypes from "vscode-languageserver-protocol";
import * as lsp from "vscode-languageserver-types";

// this could really use some tests
export function rangeToLspRange(
  document: TextDocument,
  range: Range
): lspTypes.Range | null {
  const fullContents = document.getTextInRange(new Range(0, document.length));
  let chars = 0;
  let startLspRange: lspTypes.Position | undefined;
  const lines = fullContents.split(document.eol);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const lineLength = lines[lineIndex].length + document.eol.length;
    if (!startLspRange && chars + lineLength >= range.start) {
      const character = range.start - chars;
      startLspRange = { line: lineIndex, character };
    }
    if (startLspRange && chars + lineLength >= range.end) {
      const character = range.end - chars;
      return { start: startLspRange, end: { line: lineIndex, character } };
    }
    chars += lineLength;
  }
  return null;
}

// this could really use some tests
export function lspRangeToRange(
  document: TextDocument,
  range: lspTypes.Range
): Range {
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

export function isLspLocationArray(
  x: Array<lspTypes.Location> | Array<lspTypes.LocationLink>
): x is Array<lspTypes.Location> {
  return lsp.Location.is(x[0]);
}
