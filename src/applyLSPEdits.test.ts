import { applyLSPEdits } from "./applyLSPEdits";

jest.mock("./novaUtils");
jest.mock("./lspNovaConversions", () => ({
  lspRangeToRange(_: unknown, r: unknown) {
    return r;
  },
}));

describe("Apply lsp edits", () => {
  it("applies changes to files", async () => {
    const mockEditor = { edit: jest.fn() };

    const edit1 = {
      range: {
        start: { line: 1, character: 2 },
        end: { line: 1, character: 5 },
      },
      newText: "newText1",
    };
    const edit2 = {
      range: {
        start: { line: 4, character: 0 },
        end: { line: 5, character: 0 },
      },
      newText: "newText2",
    };
    await applyLSPEdits(mockEditor as unknown as TextEditor, [edit1, edit2]);

    // file edit callbacks should apply changes
    const editCB = mockEditor.edit.mock.calls[0][0];
    const replaceMock = jest.fn();
    editCB({ replace: replaceMock });
    expect(replaceMock).toBeCalledTimes(2);
    // in reverse order
    expect(replaceMock).toHaveBeenNthCalledWith(1, edit2.range, edit2.newText);
    expect(replaceMock).toHaveBeenNthCalledWith(2, edit1.range, edit1.newText);
  });
});
