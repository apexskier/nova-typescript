# TypeScript support for Nova

This is a plugin providing TypeScript language support for the new [Nova editor from Panic](https://panic.com/nova/).

[**Install now**](nova://extension/?id=apexskier.typescript)

[Extension README](./typescript.novaextension/README.md)

## Writing Nova extensions in TypeScript

This extension is written in TypeScript. To support this I've contributed Nova extension type declarations to DefinitelyTyped. To use them, add `@types/nova-editor` (or `@types/nova-editor-node`, see [why you might need this](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/nova-editor/README.md)) to your development dependencies.

## Notes

Nova's language server support conforms to the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/). Unfortunately, the [built in language server](https://github.com/Microsoft/TypeScript/wiki/Standalone-Server-%28tsserver%29) in the TypeScript project doesn't. I've used a language server from Theia IDE that uses `tsserver` internally, which I think is the best approach. (list of [alternatives](https://microsoft.github.io/language-server-protocol/implementors/servers/), [Sourcegraph](https://github.com/sourcegraph/javascript-typescript-langserver) doesn't support TypeScript syntax correctly).

## Images

Icons have been created in Figma. View or contribute at https://www.figma.com/file/po3JE7AsJcpr0XyhAsfGH3/.

I'd like to use the symbol icons that show up in the autocomplete menu in Nova for my sidebar search so the extension feels more built-in. It looks like Nova generates these by merging a color, a character, and an internal asset called `symbol-effects`, so they're not really usable without stealing and recreating them.

The main logo comes from https://github.com/remojansen/logo.ts/.
