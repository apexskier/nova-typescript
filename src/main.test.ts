import * as informationViewModule from "./informationView";

jest.mock("./informationView");
jest.mock("./tsLibPath", () => ({
  getTsLibPath: () => "/tsLibPath",
}));
jest.mock("./isEnabledForJavascript", () => ({
  isEnabledForJavascript: () => true,
}));

jest.useFakeTimers();

(global as any).nova = Object.assign(nova, {
  commands: {
    register: jest.fn(),
  },
  workspace: {
    path: "/workspace",
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
  },
});

const originalLog = global.console.log;
global.console.log = jest.fn((...args) => {
  if (
    args[0] === "activating..." ||
    args[0] === "activated" ||
    args[0] === "reloading..."
  ) {
    return;
  }
  originalLog(...args);
});
global.console.info = jest.fn();

const CompositeDisposableMock: jest.Mock<Partial<
  CompositeDisposable
>> = jest
  .fn()
  .mockImplementation(() => ({ add: jest.fn(), dispose: jest.fn() }));
(global as any).CompositeDisposable = CompositeDisposableMock;
const ProcessMock: jest.Mock<Partial<Process>> = jest.fn();
(global as any).Process = ProcessMock;
const LanguageClientMock: jest.Mock<Partial<LanguageClient>> = jest.fn();
(global as any).LanguageClient = LanguageClientMock;

describe("test suite", () => {
  // dynamically require so global mocks are setup before top level code execution
  const { activate, deactivate } = require("./main");

  function resetMocks() {
    nova.fs.access = jest.fn().mockReturnValue(true);
    (nova.commands.register as jest.Mock).mockReset();
    LanguageClientMock.mockReset().mockImplementation(() => ({
      onRequest: jest.fn(),
      onNotification: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    }));
    ProcessMock.mockReset().mockImplementation(() => ({
      onStdout: jest.fn(),
      onStderr: jest.fn(),
      onDidExit: jest.fn((cb) => {
        cb(0);
        return { dispose: jest.fn() };
      }),
      start: jest.fn(),
    }));
    (informationViewModule.InformationView as jest.Mock).mockReset();
  }

  const reload = (nova.commands.register as jest.Mock).mock.calls.find(
    ([command]) => command == "apexskier.typescript.reload"
  )[1];

  test("global behavior", () => {
    expect(nova.commands.register).toBeCalledTimes(2);
    expect(nova.commands.register).toBeCalledWith(
      "apexskier.typescript.openWorkspaceConfig",
      expect.any(Function)
    );
    expect(nova.commands.register).toBeCalledWith(
      "apexskier.typescript.reload",
      expect.any(Function)
    );

    expect(CompositeDisposable).toBeCalledTimes(1);
  });

  function assertActivationBehavior() {
    expect(nova.commands.register).toBeCalledTimes(6);
    expect(nova.commands.register).toBeCalledWith(
      "apexskier.typescript.goToDefinition",
      expect.any(Function)
    );
    expect(nova.commands.register).toBeCalledWith(
      "apexskier.typescript.rename",
      expect.any(Function)
    );
    expect(nova.commands.register).toBeCalledWith(
      "apexskier.typescript.codeAction",
      expect.any(Function)
    );
    expect(nova.commands.register).toBeCalledWith(
      "apexskier.typescript.findSymbol",
      expect.any(Function)
    );
    expect(nova.commands.register).toBeCalledWith(
      "apexskier.typescript.findReferences",
      expect.any(Function)
    );
    expect(nova.commands.register).toBeCalledWith(
      "apexskier.typescript.autoSuggest",
      expect.any(Function)
    );

    expect(Process).toBeCalledTimes(3);
    // installs dependencies
    expect(Process).toHaveBeenNthCalledWith(1, "/usr/bin/env", {
      args: ["npm", "install"],
      cwd: "/extension",
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        NO_UPDATE_NOTIFIER: "true",
      },
    });
    // makes the run script executable
    expect(Process).toHaveBeenNthCalledWith(2, "/usr/bin/env", {
      args: ["chmod", "u+x", "/extension/run.sh"],
    });
    // gets the typescript version
    expect(Process).toHaveBeenNthCalledWith(3, "/usr/bin/env", {
      args: ["node", "/tsLibPath/tsc.js", "--version"],
      stdio: ["ignore", "pipe", "ignore"],
    });

    expect(LanguageClientMock).toBeCalledTimes(1);
    const languageClient: LanguageClient =
      LanguageClientMock.mock.results[0].value;
    expect(languageClient.start).toBeCalledTimes(1);

    expect(languageClient.onRequest).toBeCalledTimes(1);
    expect(languageClient.onRequest).toBeCalledWith(
      "workspace/applyEdit",
      expect.any(Function)
    );

    expect(informationViewModule.InformationView).toBeCalledTimes(1);
    const informationView = (informationViewModule.InformationView as jest.Mock<
      informationViewModule.InformationView
    >).mock.instances[0];
    expect(informationView.status).toBe("Running");
    expect(informationView.reload).toBeCalledTimes(1);
  }

  describe("activate and deactivate", () => {
    it("installs dependencies, runs the server, gets the ts version", async () => {
      resetMocks();

      (ProcessMock as jest.Mock<Partial<Process>>)
        .mockImplementationOnce(() => ({
          onStdout: jest.fn(),
          onStderr: jest.fn(),
          onDidExit: jest.fn((cb) => {
            cb(0);
            return { dispose: jest.fn() };
          }),
          start: jest.fn(),
        }))
        .mockImplementationOnce(() => ({
          onStdout: jest.fn(),
          onStderr: jest.fn(),
          onDidExit: jest.fn((cb) => {
            cb(0);
            return { dispose: jest.fn() };
          }),
          start: jest.fn(),
        }))
        .mockImplementationOnce(() => ({
          onStdout: jest.fn((cb) => {
            cb("ts v1.2.3\n");
            return { dispose: jest.fn() };
          }),
          onStderr: jest.fn(),
          onDidExit: jest.fn(),
          start: jest.fn(),
        }));

      await activate();

      assertActivationBehavior();

      // typescript version is reported in the information view
      const informationView = (informationViewModule.InformationView as jest.Mock<
        informationViewModule.InformationView
      >).mock.instances[0];
      expect(informationView.tsVersion).toBeUndefined();
      const tsVersionProcess: Process = ProcessMock.mock.results[2].value;
      const exitCB = (tsVersionProcess.onDidExit as jest.Mock).mock.calls[0][0];
      exitCB(0);
      // allow promise to execute
      await new Promise(setImmediate);
      expect(informationView.tsVersion).toBe("ts v1.2.3");

      deactivate();

      const languageClient: LanguageClient =
        LanguageClientMock.mock.results[0].value;
      expect(languageClient.stop).toBeCalledTimes(1);
      const compositeDisposable: CompositeDisposable =
        CompositeDisposableMock.mock.results[0].value;
      expect(compositeDisposable.dispose).toBeCalledTimes(1);
    });

    test("reload", async () => {
      resetMocks();

      await reload();

      const compositeDisposable: CompositeDisposable =
        CompositeDisposableMock.mock.results[0].value;
      expect(compositeDisposable.dispose).toBeCalledTimes(2);

      assertActivationBehavior();
    });
  });
});
