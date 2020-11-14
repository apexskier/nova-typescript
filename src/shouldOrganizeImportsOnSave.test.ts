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

jest.mock("nova-extension-utils", () => ({
  preferences: {
    getOverridableBoolean: jest.fn(),
  },
}));

describe("shouldOrganizeImportsOnSave", () => {
  beforeEach(() => {
    (nova.workspace.config.get as jest.Mock).mockReset();
    (nova.config.get as jest.Mock).mockReset();
  });

  const {
    shouldOrganizeImportsOnSave,
  } = require("./shouldOrganizeImportsOnSave");

  describe("reloads extension when it changes", () => {
    it("globally and for the workspace", () => {
      expect(nova.config.onDidChange).toBeCalledTimes(1);
      expect(nova.config.onDidChange).toBeCalledWith(
        "apexskier.typescript.config.organizeImportsOnSave",
        expect.any(Function)
      );
      expect(nova.workspace.config.onDidChange).toBeCalledTimes(1);
      expect(nova.workspace.config.onDidChange).toBeCalledWith(
        "apexskier.typescript.config.organizeImportsOnSave",
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

  it("is false by default", () => {
    expect(shouldOrganizeImportsOnSave()).toBe(false);
  });

  it("can be enabled", () => {
    const {
      preferences: { getOverridableBoolean },
    } = require("nova-extension-utils");
    getOverridableBoolean.mockReturnValue(true);
    expect(shouldOrganizeImportsOnSave()).toBe(true);
  });
});
