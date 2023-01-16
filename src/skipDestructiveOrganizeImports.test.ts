(global as any).nova = Object.assign(nova, {
  commands: {
    invoke: jest.fn(),
  },
  config: {
    onDidChange: jest.fn(),
    ["get"]: jest.fn(),
  },
  workspace: {
    config: { onDidChange: jest.fn(), ["get"]: jest.fn() },
  },
});

describe("skipDestructiveOrganizeImports", () => {
  beforeEach(() => {
    (nova.workspace.config.get as jest.Mock).mockReset();
    (nova.config.get as jest.Mock).mockReset();
  });

  const {
    skipDestructiveOrganizeImports,
  } = require("./skipDestructiveOrganizeImports");

  describe("reloads extension when it changes", () => {
    it("globally and for the workspace", () => {
      expect(nova.config.onDidChange).toBeCalledTimes(1);
      expect(nova.config.onDidChange).toBeCalledWith(
        "apexskier.typescript.config.skipDestructiveOrganizeImports",
        expect.any(Function)
      );
      expect(nova.workspace.config.onDidChange).toBeCalledTimes(1);
      expect(nova.workspace.config.onDidChange).toBeCalledWith(
        "apexskier.typescript.config.skipDestructiveOrganizeImports",
        expect.any(Function)
      );
      // same function
      const onWorkspaceChange = (nova.workspace.config.onDidChange as jest.Mock)
        .mock.calls[0][1];
      const onGlobalChange = (nova.config.onDidChange as jest.Mock).mock
        .calls[0][1];
      expect(onWorkspaceChange).toBe(onGlobalChange);
    });

    it("by calling the reload command", () => {
      const reload = (nova.config.onDidChange as jest.Mock).mock.calls[0][1];
      reload();
      expect(nova.commands.invoke).toBeCalledTimes(1);
      expect(nova.commands.invoke).toBeCalledWith(
        "apexskier.typescript.reload"
      );
    });
  });

  describe("is true by default", () => {
    expect(skipDestructiveOrganizeImports()).toBe(true);
  });

  describe("can be disabled globally", () => {
    (nova.workspace.config.get as jest.Mock).mockReturnValueOnce(null);
    (nova.config.get as jest.Mock).mockReturnValueOnce(false);
    expect(skipDestructiveOrganizeImports()).toBe(false);
  });

  describe("can be enabled globally", () => {
    (nova.workspace.config.get as jest.Mock).mockReturnValueOnce(null);
    (nova.config.get as jest.Mock).mockReturnValueOnce(true);
    expect(skipDestructiveOrganizeImports()).toBe(true);
  });

  describe("can be disabled in the workspace", () => {
    (nova.workspace.config.get as jest.Mock).mockReturnValueOnce("False");
    (nova.config.get as jest.Mock).mockReturnValueOnce(true);
    expect(skipDestructiveOrganizeImports()).toBe(false);
  });

  describe("can be enabled in the workspace", () => {
    (nova.workspace.config.get as jest.Mock).mockReturnValueOnce("True");
    (nova.config.get as jest.Mock).mockReturnValueOnce(false);
    expect(skipDestructiveOrganizeImports()).toBe(true);
  });
});
