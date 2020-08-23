import { registerApplyEdit } from "./applyEdit";
import { applyWorkspaceEdit } from "../applyWorkspaceEdit";

jest.mock("../applyWorkspaceEdit");

(global as any).nova = Object.assign(nova, {
  commands: {
    register: jest.fn(),
  },
});

describe("registerApplyEdit", () => {
  it("registers a handler that applies a language server driven edit", async () => {
    global.console.log = jest.fn();

    const client: LanguageClient = {
      onRequest: jest.fn(),
    } as any;
    registerApplyEdit(client);

    expect(client.onRequest).toBeCalledTimes(1);
    expect(client.onRequest).toBeCalledWith(
      "workspace/applyEdit",
      expect.any(Function)
    );

    const handler = (client.onRequest as jest.Mock).mock.calls[0][1];

    const edit = Symbol();
    await handler({ edit });

    expect(applyWorkspaceEdit).toBeCalledWith(edit);
  });
});
