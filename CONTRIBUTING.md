# Contributing

## Development

### Running locally

Clone this project, and open it in Nova.

Run `yarn` in a terminal to install dependencies.

Run the Development task to build scripts and auto-rebuild on file changes.

Turn on extension development in Nova in Preferences > General > Extension Development. If you've installed the TypeScript extension from the Extension Library, disable it, then activate the local one with Extensions > Activate Project as Extension.

### Debugging

To debug the underlying language server, modify the `run.sh` file to use the [`--inspect` flag](https://nodejs.org/en/docs/guides/debugging-getting-started/) and use [your preferred inspector to debug](https://nodejs.org/en/docs/guides/debugging-getting-started/#inspector-clients).

Use the Extension Console in Nova to debug the extension. I haven't found a way to get a debugger attached to the JavaScriptCore context.

### Extension dependencies

The extension relies on local copies of both `typescript-language-server` and `typescript` itself. To avoid a large bundled extension size (Panic has a limit, you'll get 500 errors when submitting above ~50mb) these are locked with a [`shrinkwrap file`](https://docs.npmjs.com/configuring-npm/shrinkwrap-json.html).

To update, install locally in the `typescript.novaextension` directory, then run `npm shrinkwrap`.

## Publishing notes

Always run `yarn build` first, so the `typescript.novaextension/node_modules` directory is cleared.
