// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import { applyWorkspaceEdit } from "../applyWorkspaceEdit";

// @Panic: this is totally decoupled from typescript, so it could totally be native to Nova

export function registerApplyEdit(client: LanguageClient) {
  client.onRequest(
    "workspace/applyEdit",
    async (params: lspTypes.ApplyWorkspaceEditParams) => {
      console.log("workspace/applyEdit", params.label);
      await applyWorkspaceEdit(params.edit);
    }
  );
}
