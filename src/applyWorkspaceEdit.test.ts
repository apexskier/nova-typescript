import { applyWorkspaceEdit } from "./applyWorkspaceEdit";
import * as novaUtils from "./novaUtils";

jest.mock("./novaUtils");
jest.mock("./lspNovaConversions", () => ({
  lspRangeToRange(_: unknown, r: unknown) {
    return r;
  },
}));

describe("Apply workspace edit", () => {
  it("can be a noop", async () => {
    await applyWorkspaceEdit({});
  });

  it("applies changes to files", async () => {
    class Editor {
      // eslint-disable-next-line no-unused-vars
      constructor(readonly fileURI: string) {}
      edit = jest.fn();
    }
    (novaUtils as any).openFile = jest.fn((uri) => new Editor(uri));

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
    await applyWorkspaceEdit({
      changes: {
        fileURI1: [edit1],
        fileURI2: [edit1, edit2],
        fileURI3: [],
      },
    });

    // each file with changes should be opened
    expect(novaUtils.openFile).toBeCalledTimes(2);
    const openFileMock = (novaUtils.openFile as jest.Mock).mock;
    expect(novaUtils.openFile).toHaveBeenNthCalledWith(1, "fileURI1");
    expect(novaUtils.openFile).toHaveBeenNthCalledWith(2, "fileURI2");
    // each file should be edited
    const file1: TextEditor = openFileMock.results[0].value;
    expect(file1.edit).toBeCalledTimes(1);
    const file2: TextEditor = openFileMock.results[1].value;
    expect(file2.edit).toBeCalledTimes(1);

    // file edit callbacks should apply changes
    const file1EditCB = (file1.edit as jest.Mock).mock.calls[0][0];
    const replaceMock1 = jest.fn();
    file1EditCB({ replace: replaceMock1 });
    const file2EditCB = (file2.edit as jest.Mock).mock.calls[0][0];
    const replaceMock2 = jest.fn();
    file2EditCB({ replace: replaceMock2 });
    expect(replaceMock1).toBeCalledTimes(1);
    expect(replaceMock1).toBeCalledWith(edit1.range, edit1.newText);
    expect(replaceMock2).toBeCalledTimes(2);
    // reverse order
    expect(replaceMock2).toHaveBeenNthCalledWith(1, edit2.range, edit2.newText);
    expect(replaceMock2).toHaveBeenNthCalledWith(2, edit1.range, edit1.newText);
  });
});
