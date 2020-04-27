declare module "nova" {
  global {
    const nova: Nova.NovaObject;

    class LanguageClient {
      constructor(
        identifier: string,
        name: string,
        serverOptions: {
          type?: "stdio" | "socket" | "pipe";
          path: string;
          args?: Array<string>;
          env?: { [key: string]: string };
        },
        clientOptions: { syntaxes: Array<string> }
      );

      readonly identifier: string;
      readonly name: string;
      readonly running: boolean;

      onNotification(
        method: string,
        callback: (parameters: unknown) => void
      ): void;
      onRequest(
        method: string,
        callback: (parameters: unknown) => unknown | Promise<unknown>
      ): void;
      sendRequest(method: string, parameters?: unknown): Promise<unknown>;
      sendNotification(method: string, parameters?: unknown): void;
      start(): void;
      stop(): void;
    }
  }

  namespace Nova {
    interface Configuration {}

    type TextDocument = unknown;
    type TextEditor = unknown;

    interface Workspace {
      readonly path: string | null;
      readonly config: Configuration;
      readonly textDocuments: ReadonlyArray<TextDocument>;
      readonly textEditors: ReadonlyArray<TextEditor>;
      readonly activeTextEditor: TextEditor;

      onDidAddTextEditor(callback: (editor: TextEditor) => void): void;
      onDidChangePath(callback: (newPath: TextEditor) => void): void;
    }

    interface Extension {
      readonly identifier: string;
      readonly name: string;
      readonly vendor: string;
      readonly version: string;
      readonly path: string;
      readonly globalStoragePath: string;
      readonly workspaceStoragePath: string;
    }

    interface NovaObject {
      readonly workspace: Workspace;
      readonly extension: Extension;
    }
  }
}
