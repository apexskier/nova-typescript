import { InformationView } from "./informationView";

const reload = jest.fn();

describe("InformationView", () => {
  beforeEach(() => {
    reload.mockClear();

    (global as any).nova = Object.assign(nova, {
      commands: {
        register: jest.fn(),
      },
    });

    class MockTreeView {
      reload = reload;
    }
    (global as any).TreeView = MockTreeView;
  });

  it("registers a reload command", async () => {
    const globalReload = jest.fn();
    new InformationView(globalReload);
    expect(nova.commands.register).toHaveBeenCalledWith(
      "apexskier.typescript.refreshInformation",
      expect.any(Function)
    );
    const command = (nova.commands.register as jest.Mock).mock.calls[0][1];
    await command();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(globalReload).toHaveBeenCalledTimes(1);
  });

  it("has no subchildren", () => {
    const iv = new InformationView(jest.fn());
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

    const iv = new InformationView(jest.fn());
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
    const iv = new InformationView(jest.fn());
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
