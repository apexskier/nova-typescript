import { registerPublishDiagnostics } from "./publishDiagnostics";

(global as any).nova = Object.assign(nova, {
  commands: {
    register: jest.fn(),
  },
});

describe("registerPublishDiagnostics", () => {
  it("registers a handler that applies a language server driven edit", async () => {
    global.console.log = jest.fn();

    const client: LanguageClient = {
      onRequest: jest.fn(),
    } as any;
    registerPublishDiagnostics(client);

    expect(client.onRequest).toBeCalledTimes(1);
    expect(client.onRequest).toBeCalledWith(
      "textDocument/publishDiagnostics",
      expect.any(Function)
    );

    const handler = (client.onRequest as jest.Mock).mock.calls[0][1];

    await handler();
  });
});
