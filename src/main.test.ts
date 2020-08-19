import * as informationViewModule from "./informationView";

jest.mock("./informationView");
jest.mock("./tsLibPath", () => ({
  getTsLibPath: () => "/tsLibPath",
}));

(global as any).nova = Object.assign(nova, {
  commands: {
    register: jest.fn(),
  },
  extension: {
    path: "/extension",
  },
  fs: {
    access: jest.fn(),
  },
  path: {
    join: jest.fn(),
  },
});

const CompositeDisposableMock: jest.Mock<CompositeDisposable> = jest
  .fn()
  .mockImplementation(() => ({ add: jest.fn() }));
(global as any).CompositeDisposable = CompositeDisposableMock;

const ProcessMock: jest.Mock<Process> = jest.fn().mockImplementation(() => ({
  onStderr: jest.fn(),
  onDidExit: jest.fn((cb) => cb(0)),
  start: jest.fn(),
}));
(global as any).Process = ProcessMock;

const originalLog = global.console.log;
global.console.log = jest.fn((...args) => {
  if (args[0] === "activating...") {
    return;
  }
  originalLog(...args);
});

describe("test suite", () => {
  // dynamically require so global mocks are setup before top level code execution
  const { activate, deactivate } = require("./main");

  // (informationViewModule.InformationView as jest.Mock).mockImplementation(() => {})

  describe("activate", () => {
    it("installs dependencies, runs the server, gets the ts version", () => {
      nova.fs.access = jest.fn().mockReturnValue(true);

      activate();

      expect(nova.commands.register).toBeCalledTimes(2);
      expect(nova.commands.register).toBeCalledWith(
        "apexskier.typescript.openWorkspaceConfig",
        expect.any(Function)
      );
      expect(nova.commands.register).toBeCalledWith(
        "apexskier.typescript.reload",
        expect.any(Function)
      );

      expect(Process).toHaveBeenNthCalledWith(1, "/usr/bin/env", {
        args: ["npm", "install"],
        cwd: "/extension",
        stdio: ["ignore", "pipe", "pipe"],
      });

      expect(informationViewModule.InformationView).toBeCalledTimes(1);
      const informationView = (informationViewModule.InformationView as jest.Mock<
        informationViewModule.InformationView
      >).mock.instances[0];
      expect(informationView.status).toBe("Running");
      expect(informationView.reload).toBeCalledTimes(1);
    });

    describe("reloads when tslibPath changes", () => {
      it.skip("globally", () => {});
      it.skip("for the workspace", () => {});
    });
  });

  describe("deactivate", () => {});
});
