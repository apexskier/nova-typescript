(global as any).nova = Object.assign(nova, {
  commands: {
    register: jest.fn(),
    invoke: jest.fn(),
  },
  config: {
    onDidChange: jest.fn(),
    ["get"]: jest.fn(),
  },
  extension: {
    path: "/extension",
  },
  fs: {
    access: jest.fn(),
  },
  path: {
    join(...args: string[]) {
      return args.join("/");
    },
    isAbsolute: jest.fn((path) => path.startsWith("/")),
  },
  workspace: {
    config: { onDidChange: jest.fn(), ["get"]: jest.fn() },
  },
});

describe("tsLibPath", () => {
  beforeEach(() => {
    (nova.workspace.config.get as jest.Mock).mockReset();
    (nova.workspace as any).path = "/workspace";
    (nova.config.get as jest.Mock).mockReset();
  });

  const { getTsLibPath } = require("./tsLibPath");

  describe("reloads extension when it changes", () => {
    it("globally and for the workspace", () => {
      expect(nova.config.onDidChange).toBeCalledTimes(1);
      expect(nova.config.onDidChange).toBeCalledWith(
        "apexskier.typescript.config.tslibPath",
        expect.any(Function)
      );
      expect(nova.workspace.config.onDidChange).toBeCalledTimes(1);
      expect(nova.workspace.config.onDidChange).toBeCalledWith(
        "apexskier.typescript.config.tslibPath",
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

  describe("returns extension path", () => {
    beforeAll(() => {
      nova.fs.access = jest.fn().mockReturnValue(true);
    });

    it("defaults to the workspace's installation", () => {
      expect(getTsLibPath()).toBe("/workspace/node_modules/typescript/lib");
    });

    it("uses the extension installation if workspace hasn't been saved", () => {
      (nova.workspace.path as any) = "";
      expect(getTsLibPath()).toBe("/extension/node_modules/typescript/lib");
    });

    it("uses the workspace config", () => {
      (nova.workspace.config.get as any) = jest.fn(() => "/workspaceconfig");
      expect(getTsLibPath()).toBe("/workspaceconfig");
    });

    it("uses the global config", () => {
      (nova.config.get as any) = jest.fn(() => "/globalconfig");
      expect(getTsLibPath()).toBe("/globalconfig");
    });

    it("uses the workspace config over the global config", () => {
      (nova.workspace.config.get as any) = jest.fn(() => "/workspaceconfig");
      (nova.config.get as any) = jest.fn(() => "/globalconfig");
      expect(getTsLibPath()).toBe("/workspaceconfig");
    });

    it("resolved relatively to the workspace", () => {
      (nova.workspace.config.get as any) = jest.fn(() => "../workspaceconfig");
      expect(getTsLibPath()).toBe("/workspace/../workspaceconfig");
    });
  });

  describe("if tslib is missing returns null and", () => {
    beforeEach(() => {
      nova.fs.access = jest.fn().mockReturnValue(false);
      nova.workspace.showErrorMessage = jest.fn();
    });

    describe("warns if the config is wrong", () => {
      afterEach(() => {
        expect(getTsLibPath()).toBeNull();
        expect(nova.workspace.showErrorMessage as jest.Mock).toBeCalledTimes(1);
        expect(nova.workspace.showErrorMessage as jest.Mock).toBeCalledWith(
          "Your TypeScript library couldn't be found, please check your settings."
        );
      });

      it("for the workspace", () => {
        (nova.workspace.config.get as any) = jest.fn(() => "/workspaceconfig");
      });

      it("globally", () => {
        (nova.config.get as any) = jest.fn(() => "/globalconfig");
      });
    });

    it("errors if it's the extension's false", () => {
      global.console.error = jest.fn();
      expect(getTsLibPath()).toBe(null);
      expect(nova.workspace.showErrorMessage as jest.Mock).toBeCalledTimes(0);
      expect(global.console.error).toBeCalledTimes(1);
    });

    it("warns if the workspace isn't saved, but is configured relatively", () => {
      (nova.workspace.path as any) = "";
      (nova.workspace.config.get as any) = jest.fn(() => "../workspaceconfig");
      expect(getTsLibPath()).toBeNull();
      expect(nova.workspace.showErrorMessage as jest.Mock).toBeCalledTimes(1);
      expect(nova.workspace.showErrorMessage as jest.Mock).toBeCalledWith(
        "Save your workspace before using a relative TypeScript library path."
      );
    });
  });
});
