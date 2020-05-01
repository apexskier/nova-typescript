# Typescript support for Nova

This is a plugin providing typescript language support for the new [Nova editor from Panic](https://panic.com/nova/).

It is a **work in progress**, but does work. There's currently a [bug in the editor](https://dev.panic.com/panic/nova-issues/-/issues/888) preventing me from publishing.

See https://github.com/DefinitelyTyped/DefinitelyTyped/pull/44290 for nova extension types.

[Extension README](./typescript.novaextension/README.md)

## Notes

Nova's language server support conforms to the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/). Unfortunately, the [built in language server](https://github.com/Microsoft/TypeScript/wiki/Standalone-Server-%28tsserver%29) in the typescript project doesn't. I've used a language server from Theia IDE that uses `tsserver` internally, which I think is the best approach. (list of [alternatives](https://microsoft.github.io/language-server-protocol/implementors/servers/), [Sourcegraph](https://github.com/sourcegraph/javascript-typescript-langserver) doesn't support typescript syntax correctly).
