// eslint-disable-next-line no-unused-vars
import type * as lspTypes from "vscode-languageserver-protocol";
import { applyWorkspaceEdit } from "../applyWorkspaceEdit";

// @Panic: this is totally decoupled from typescript, so it could totally be native to Nova

// part of the core language spec, but not implemented by Nova
// https://novadocs.panic.com/api-reference/language-client/#onrequest-method-callback

export function registerApplyEdit(client: LanguageClient) {
  client.onRequest(
    "workspace/applyEdit",
    async (params: lspTypes.ApplyWorkspaceEditParams) => {
      await applyWorkspaceEdit(params.edit);
    }
  );
}
