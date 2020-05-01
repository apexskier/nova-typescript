# Contributing

## Development

### Running locally

Clone this project, and open it in Nova. Run the Development task to build scripts and auto-rebuild on file changes.

Turn on extension development in Nova in Preferences > General > Extension Development. I've you've installed the Typescript extension from the Extension Library, disable it, then activate the local one with Extensions > Activate Project as Extension.

### Debugging

To debug the underlying tsserver, add the [`--inspect` flag](https://nodejs.org/en/docs/guides/debugging-getting-started/) in the `run.sh` file's `node` command and use [your preferred inspector to debug](https://nodejs.org/en/docs/guides/debugging-getting-started/#inspector-clients).

Use the Extension Console in Nova to debug the extension. I haven't found a way to get a debugger attached to the JavaScriptCore context.
