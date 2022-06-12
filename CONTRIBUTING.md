# Contributing

## Development

### Running locally

Clone this project, and open it in Nova.

Run `yarn` in a terminal to install dependencies.

Run the Development task to build scripts and auto-rebuild on file changes.

Turn on extension development in Nova in Preferences > General > Extension Development. If you've installed the TypeScript extension from the Extension Library, disable it, then activate the local one with Extensions > Activate Project as Extension.

### Debugging

To debug the underlying language server, modify the `run.sh` file to use the [`--inspect` flag](https://nodejs.org/en/docs/guides/debugging-getting-started/) and use [your preferred inspector to debug](https://nodejs.org/en/docs/guides/debugging-getting-started/#inspector-clients).

To debug the underlying `tsserver` modify the language server code to exec it through `node` with [`--inspect`](https://nodejs.org/en/docs/guides/debugging-getting-started/). The file to be modified is `~/Library/Application Support/Nova/Extensions/apexskier.typescript/dependencyManagement/node_modules/typescript-language-server/lib/tsp-client.js`. (Set `args = ['node', '--inspect-brk', tsserverPath]` and replace `tsserverPath` with `'/usr/bin/env'` in `cp.fork`/`cp.spawn`.) You can increase server shutdown timeouts in the file `~/Library/Application Support/Nova/Extensions/apexskier.typescript/dependencyManagement/node_modules/typescript-language-server/lib/utils.js`

Use the Extension Console in Nova to debug the extension. I haven't found a way to get a debugger attached to the JavaScriptCore context.

### Extension dependencies

The extension relies on local copies of both `typescript-language-server` and `typescript` itself. To avoid a large bundled extension size (Panic has a limit, you'll get 500 errors when submitting above ~50mb) these are locked with a [`shrinkwrap file`](https://docs.npmjs.com/configuring-npm/shrinkwrap-json.html).

To update, run `npm install ...` locally in the `typescript.novaextension` directory. The shrinkwrap file should be updated automatically.

## Pull Requests

### Changelog

All user-facing changes should be documented in [CHANGELOG.md](./CHANGELOG.md).

- If not present, add a `## future` section above the latest release
- If not present, add a `###` heading for the category of your changes. Categories can include
  - Breaking - backwards incompatible changes (semver major version bump)
  - Added - new features (semver minor version bump)
  - Fixed - bugfixes (semver patch version bump)
  - Changed - tweaks or changes that don't significantly change how the extension is used
- Add a single line for each change you've made

## Publishing notes

Run `yarn build` first.

Replace `future` in the changelog with a new version, following semver. Update the version in the [bug report template](./.github/ISSUE_TEMPLATE/bug_report.md) and [extension manifest](./typescript.novaextension/extension.json).

Publish to the extension library (Extensions > Submit to the Extension Library…).

**On the same commit** create and push a tag for the version `git tag $VERSION && git push --tags`. A github action will create a release and perform some automated housekeeping.
