import * as informationViewModule from "./informationView";

jest.mock("./informationView");
jest.mock("./tsLibPath", () => ({
  getTsLibPath: () => "/tsLibPath",
}));
jest.mock("./isEnabledForJavascript", () => ({
  isEnabledForJavascript: () => true,
}));
jest.mock("nova-extension-utils");

jest.useFakeTimers();

(global as any).nova = Object.assign(nova, {
  commands: {
    register: jest.fn(),
    invoke: jest.fn(),
  },
  workspace: {
    path: "/workspace",
    onDidAddTextEditor: jest.fn(),
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
    const {
      dependencyManagement: { installWrappedDependencies },
    } = require("nova-extension-utils");
    installWrappedDependencies
      .mockReset()
      .mockImplementation(() => Promise.resolve());
    nova.fs.access = jest.fn().mockReturnValue(true);
    (nova.commands.register as jest.Mock).mockReset();
    (nova.commands.invoke as jest.Mock).mockReset();
    LanguageClientMock.mockReset().mockImplementation(() => ({
      onRequest: jest.fn(),
      onNotification: jest.fn(),
      onDidStop: jest.fn(),
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
    (nova.workspace.onDidAddTextEditor as jest.Mock).mockReset();
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

    const {
      registerDependencyUnlockCommand,
    } = require("nova-extension-utils").dependencyManagement;
    expect(registerDependencyUnlockCommand).toBeCalledTimes(1);
    expect(registerDependencyUnlockCommand).toBeCalledWith(
      "apexskier.typescript.forceClearLock"
    );
  });

  function assertActivationBehavior() {
    expect(nova.commands.register).toBeCalledTimes(4);
    expect(nova.commands.register).toBeCalledWith(
      "apexskier.typescript.rename",
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
      "apexskier.typescript.commands.organizeImports",
      expect.any(Function)
    );

    // installs dependencies

    const {
      dependencyManagement: { installWrappedDependencies },
    } = require("nova-extension-utils");
    expect(installWrappedDependencies).toBeCalledTimes(1);

    expect(Process).toBeCalledTimes(2);
    // makes the run script executable
    expect(Process).toHaveBeenNthCalledWith(1, "/usr/bin/env", {
      args: ["chmod", "u+x", "/extension/run.sh"],
    });
    // gets the typescript version
    expect(Process).toHaveBeenNthCalledWith(2, "/usr/bin/env", {
      args: ["node", "/tsLibPath/tsc.js", "--version"],
      stdio: ["ignore", "pipe", "ignore"],
    });

    expect(LanguageClientMock).toBeCalledTimes(1);
    const languageClient: LanguageClient =
      LanguageClientMock.mock.results[0].value;
    expect(languageClient.start).toBeCalledTimes(1);

    expect(languageClient.onRequest).not.toBeCalled();

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
      const tsVersionProcess: Process = ProcessMock.mock.results[1].value;
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

    it("shows an error if activation fails", async () => {
      resetMocks();
      global.console.error = jest.fn();
      global.console.warn = jest.fn();
      nova.workspace.showErrorMessage = jest.fn();

      const {
        dependencyManagement: { installWrappedDependencies },
      } = require("nova-extension-utils");
      installWrappedDependencies.mockImplementation(() =>
        Promise.reject(new Error("Failed to install:\n\nsome output on stderr"))
      );

      await activate();

      expect(nova.workspace.showErrorMessage).toBeCalledWith(
        new Error("Failed to install:\n\nsome output on stderr")
      );
    });

    it("handles unexpected crashes", async () => {
      resetMocks();
      nova.workspace.showActionPanel = jest.fn();

      await activate();

      const languageClient: LanguageClient =
        LanguageClientMock.mock.results[0].value;
      const stopCallback = (languageClient.onDidStop as jest.Mock).mock
        .calls[0][0];

      stopCallback(new Error("Mock language server crash"));

      expect(nova.workspace.showActionPanel).toBeCalledTimes(1);
      const actionPanelCall = (nova.workspace.showActionPanel as jest.Mock).mock
        .calls[0];
      expect(actionPanelCall[0]).toMatchInlineSnapshot(`
        "TypeScript Language Server stopped unexpectedly:

        Error: Mock language server crash

        Please report this, along with any output in the Extension Console."
      `);
      expect(actionPanelCall[1].buttons).toHaveLength(2);

      const informationView = (informationViewModule.InformationView as jest.Mock<
        informationViewModule.InformationView
      >).mock.instances[0];
      expect(informationView.status).toBe("Stopped");

      const actionCallback = actionPanelCall[2];

      // reload
      expect(nova.commands.invoke).not.toBeCalled();
      actionCallback(0);
      expect(nova.commands.invoke).toBeCalledTimes(1);
      expect(nova.commands.invoke).toBeCalledWith(
        "apexskier.typescript.reload"
      );

      // ignore
      actionCallback(1);
    });

    test("reload", async () => {
      resetMocks();

      await reload();

      const compositeDisposable: CompositeDisposable =
        CompositeDisposableMock.mock.results[0].value;
      expect(compositeDisposable.dispose).toBeCalledTimes(2);

      assertActivationBehavior();
    });

    test("watches files for import organization", async () => {
      resetMocks();

      await activate();

      (nova as any).config = { onDidChange: jest.fn() };
      (nova as any).workspace.config = { onDidChange: jest.fn() };

      expect(nova.workspace.onDidAddTextEditor).toBeCalledTimes(1);
      const setupWatcher = (nova.workspace.onDidAddTextEditor as jest.Mock).mock
        .calls[0][0];
      const mockEditor = {
        onWillSave: jest.fn(),
        onDidDestroy: jest.fn(),
        document: {
          syntax: "typescript",
          onDidChangeSyntax: jest.fn(),
        },
      };
      setupWatcher(mockEditor);
      expect(mockEditor.onWillSave).toBeCalledTimes(0);

      require("nova-extension-utils").preferences.getOverridableBoolean.mockReturnValue(
        true
      );
      setupWatcher(mockEditor);
      expect(mockEditor.onWillSave).toBeCalledTimes(1);

      const saveHandler = (mockEditor.onWillSave as jest.Mock).mock.calls[0][0];
      await saveHandler(mockEditor);
      expect(nova.commands.invoke).toHaveBeenNthCalledWith(
        1,
        "apexskier.typescript.commands.organizeImports",
        mockEditor
      );
    });
  });
});
