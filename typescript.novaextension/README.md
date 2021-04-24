# TypeScript Extension

This extension provides rich TypeScript integration through a dedicated language server for both TypeScript and javascript code. Hover over symbols to see type information, receive better autocomplete suggestions, and see type warnings and errors inline. Quickly search for symbols across your project and type dependencies using the "Find Symbol" command. Apply common code refactors such with code actions. Clean your code with import organization and document formatting.

## Usage

### Editor functionality

The main functionality is found inline in the editor.

**Inline errors**

Inline errors can also be found in the Issues sidebar (View > Sidebars > Show Issues Sidebar).

<img src="https://raw.githubusercontent.com/apexskier/nova-typescript/14378cc1fccc752cff1bceef2706f98915966a3b/typescript.novaextension/Images/README/example-error.png" width="400" alt="Example errors">

**Type info on hover**

<img src="https://raw.githubusercontent.com/apexskier/nova-typescript/14378cc1fccc752cff1bceef2706f98915966a3b/typescript.novaextension/Images/README/example-typeinfo.png" width="400" alt="Example type info">

### Editor commands

Right click source code and choose the following from the TypeScript menu.

- Find References
- Rename Symbol
- Organize Imports
- Format Document
- Offer Suggestions (experimental)

### Workspace commands

From the menu, select Extensions > TypeScript.

- Find Symbol

### Code actions

From the menu, select Editor > Show Code Actions, or click the "Lightbulb" icon in your editor.

These code actions are specific to your version of typescript and to the code you've selected. [Here's an example to convert to optional chaining](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#convert-to-optional-chaining).

<img src="https://raw.githubusercontent.com/apexskier/nova-typescript/9352766eda9b46e7be8ddc7d2a80a059753b21cf/typescript.novaextension/Images/README/example-code-actions.png" width="400" alt="Example code actions">

### Sidebar

The TS/JS sidebar shows status information about the extension including the version of typescript it's using and if it's started successfully. To access the sidebar, click the “All Sidebars” button or View > Sidebars > Show All Sidebars, then the TS/JS item. It can be dragged into the sidebar header for quick access.

<img src="https://raw.githubusercontent.com/apexskier/nova-typescript/3cbd2a83f37df63e3e249d16d741ebea82254640/typescript.novaextension/Images/README/example-sidebar.png" width="400" alt="Sidebar information">

### Find Symbol

Find Symbol performs a project search for a symbol. Results are shown in the TS/JS sidebar.

<img src="https://raw.githubusercontent.com/apexskier/nova-typescript/fdf669355c7ffcec4a943ebc9de76b45738f08a7/typescript.novaextension/Images/README/example-findsymbol.png" width="400" alt="Find symbol sidebar">

### Find References

Find References shows all usages of a given variable, function, or other symbol. Results are shown in the TS/JS sidebar.

<img src="https://user-images.githubusercontent.com/329222/90985881-070b2680-e57f-11ea-83e6-89ab3d4df055.png" width="400" alt="Find references sidebar">

### Using the workspace version of TypeScript

This extension will automatically find the workspace version of TypeScript installed under `node_modules` in your workspace root. If one isn't installed it will use a recent, bundled version of typescript.

To customize this you can specify the TypeScript library location in workspace preferences (Extensions > TypeScript > Preferences > TypeScript Library) as an absolute or workspace-relative path. This should point to a directory containing the TypeScript `tsserver.js` file, generally ending with `node_modules/typescript/lib`. If installed globally, you can find the installation location using `npm list -g typescript` (e.g. "/usr/local/lib/node_modules/typescript/lib"). (You should only need this if your workspace doesn't install typescript under the workspace's root `node_modules` directory or you use a global installation of TypeScript)

### Enable/Disable for Javascript

In certain situations, such as when working with Flow types, you may need to disable this in javascript files. You can do this by configuring preferences per-project in Project Settings or globally in the Extension Library.

## Troubleshooting

Many issues are caused by a missing or improperly configured local node/npm installation.

Check the Extension Console by turning on extension development in Nova in Preferences > General > Extension Development, then Extensions > Show Extension Console, then filter by Source.

- Check for any warnings or errors. They might indicate a problem with your local environment or a bug with the extension.
- If you see
  ```
  activating...
  Already locked
  ```
  and _do not see_
  ```
  activated
  ```
  something may have gone wrong. Try running the "Force Unlock Dependency Installation" command for this extension.
