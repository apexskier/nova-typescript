# Typescript support for Nova

This is a plugin providing typescript language support for the new [Nova editor from Panic](https://panic.com/nova/).

It is a **work in progress**, but does work. There's currently a [Nova bug](https://dev.panic.com/panic/nova-issues/-/issues/888) preventing me from publishing.

It's written in typescript, in the Nova editor. See https://github.com/DefinitelyTyped/DefinitelyTyped/pull/44290 for nova extension types.


![Example errors](https://raw.githubusercontent.com/apexskier/nova-typescript/14378cc1fccc752cff1bceef2706f98915966a3b/typescript.novaextension/Images/README/example-error.png)

![Example type info](https://raw.githubusercontent.com/apexskier/nova-typescript/14378cc1fccc752cff1bceef2706f98915966a3b/typescript.novaextension/Images/README/example-typeinfo.png)

## Notes

Nova's language server support conforms to the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/). Unfortunately, the [built in language server](https://github.com/Microsoft/TypeScript/wiki/Standalone-Server-%28tsserver%29) in the typescript project doesn't appear to conform to this.

I've used a ~[separate language server from Sourcegraph](https://github.com/sourcegraph/javascript-typescript-langserver)~ (this one doesn't seem to support typescript syntax correctly) language server from Theia IDE which seems to be working (it uses `tsserver` internally, which I think is the best approach). (list of [alternatives](https://microsoft.github.io/language-server-protocol/implementors/servers/))

## TODO

- [x] Make sure the language server's typescript version can match what's installed locally. Using the builtin `tsserver` from the workspace's `node_modules` would be my preferred way of doing this.
- [x] `activationEvents` shouldn't include `"*"`, but otherwise I can't get it to activate
- [x] Module resolution doesn't seem to be working at all outside of this project.
- [ ] Trigger autocomplete suggestions
- [ ] Very slow right now...
