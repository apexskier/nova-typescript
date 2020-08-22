import { InformationView } from "./informationView";

const reload = jest.fn();

describe("InformationView", () => {
  beforeEach(() => {
    reload.mockClear();

    class MockTreeView {
      reload = reload;
    }
    (global as any).TreeView = MockTreeView;
  });

  it("has no subchildren", () => {
    const iv = new InformationView();
    expect(
      iv.getChildren({
        title: "title",
        value: "value",
        identifier: "identifier",
      })
    ).toEqual([]);
  });

  it("renders tree items", () => {
    class MockTreeItem {
      // eslint-disable-next-line no-unused-vars
      constructor(readonly title: unknown, readonly state: unknown) {}
    }
    (global as any).TreeItem = MockTreeItem;
    (global as any).TreeItemCollapsibleState = {
      None: Symbol("TreeItemCollapsibleState.None"),
    };

    const iv = new InformationView();
    const item = iv.getTreeItem({
      title: "title",
      value: "value",
      identifier: "identifier",
    });
    expect(item).toMatchInlineSnapshot(`
      MockTreeItem {
        "descriptiveText": "value",
        "identifier": "identifier",
        "state": Symbol(TreeItemCollapsibleState.None),
        "title": "title",
      }
    `);
  });

  it("displays the current status and typescript version", () => {
    const iv = new InformationView();
    expect(iv.getChildren(null)).toMatchInlineSnapshot(`
      Array [
        Object {
          "identifier": "status",
          "title": "Status",
          "value": "Inactive",
        },
        Object {
          "identifier": "tsversion",
          "title": "TypeScript Version",
          "value": "",
        },
      ]
    `);

    iv.status = "Testing";

    expect(reload).toHaveBeenLastCalledWith({
      identifier: "status",
      title: "Status",
      value: "Testing",
    });
    expect(iv.getChildren(null)).toMatchInlineSnapshot(`
      Array [
        Object {
          "identifier": "status",
          "title": "Status",
          "value": "Testing",
        },
        Object {
          "identifier": "tsversion",
          "title": "TypeScript Version",
          "value": "",
        },
      ]
    `);

    iv.tsVersion = "1.2.3";

    expect(reload).toHaveBeenLastCalledWith({
      identifier: "tsversion",
      title: "TypeScript Version",
      value: "1.2.3",
    });
    expect(iv.getChildren(null)).toMatchInlineSnapshot(`
      Array [
        Object {
          "identifier": "status",
          "title": "Status",
          "value": "Testing",
        },
        Object {
          "identifier": "tsversion",
          "title": "TypeScript Version",
          "value": "1.2.3",
        },
      ]
    `);

    expect(reload).toHaveBeenCalledTimes(2);
  });
});
