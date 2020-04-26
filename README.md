# Typescript support for Nova

This is a playground for typescript language support for the new [Nova editor from Panic](https://panic.com/nova/).

This is a **work in progress**.

## Notes

Nova's language server support conforms to the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/). Unfortunately, the [built in language server](https://github.com/Microsoft/TypeScript/wiki/Standalone-Server-%28tsserver%29) in the typescript project doesn't appear to conform to this.

In future, I'm hoping to create a wrapper around the built in `tsserver` that transforms its JSON protocol to the Language Server Protocol, as I think that would be the best dev experience.

In the meantime, just to start playing around, I've used a [separate language server from Sourcegraph](https://github.com/sourcegraph/javascript-typescript-langserver) (there are [alternatives](https://microsoft.github.io/language-server-protocol/implementors/servers/)) which seems to be working.

## TODO

- [ ] Make sure the language server's typescript version can match what's installed locally. Using the builtin `tsserver` from the workspace's `node_modules` would be my preferred way of doing this.
- [ ] `activationEvents` shouldn't include `"*"`, but otherwise I can't get it to activate
- [ ] Module resolution doesn't seem to be working at all outside of this project.
- [ ] Very slow right now...
