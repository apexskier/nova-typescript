(global as any).nova = Object.assign(nova, {
  commands: {
    register: jest.fn(),
  },
  config: {
    onDidChange: jest.fn(),
    ["get"]: jest.fn(),
  },
  workspace: {
    config: { onDidChange: jest.fn(), ["get"]: jest.fn() },
  },
});

test("tsLibPath", () => {
  const { getTsLibPath } = require("./tsLibPath");
});
