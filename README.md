# TypeScript support for Nova

This is a plugin providing TypeScript and advanced JavaScript language support for the new [Nova editor from Panic](https://panic.com/nova/).

[**Install now**](https://camlittle.com/typescript.novaextension)

[Extension README](./typescript.novaextension/README.md)

## Writing Nova extensions in TypeScript

This extension is written in TypeScript. To support this I've contributed Nova extension type declarations to DefinitelyTyped. To use them, add `@types/nova-editor` (or `@types/nova-editor-node`, see [why you might need this](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/nova-editor/README.md)) to your development dependencies.

## Notes

Nova's language server support conforms to the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/). Unfortunately, [TypeScript's server](https://github.com/Microsoft/TypeScript/wiki/Standalone-Server-%28tsserver%29) doesn't ([but might in the future - follow this ticket](https://github.com/microsoft/TypeScript/issues/39459)). This extension uses [`typescript-language-server`](https://github.com/theia-ide/typescript-language-server/) to translate between the Language Server Protocol and `tsserver`.

## Images

Custom icons have been created in Figma. View or contribute at https://www.figma.com/file/po3JE7AsJcpr0XyhAsfGH3/.

The main logo comes from https://github.com/remojansen/logo.ts/.
