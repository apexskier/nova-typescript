# TypeScript Extension

This extension provides rich TypeScript integration through a dedicated language server for both TypeScript and javascript code. Hover over symbols to see type information, receive better autocomplete suggestions, and see type warnings and errors inline. Quickly search for symbols across your project and type dependencies using the "Find Symbol" command. Apply common code refactors with code actions.

### Editor commands:

Right click source code and choose the following from the TypeScript menu.

- Go to Definition
- Find References
- Rename Symbol
- Code Actions
- Offer Suggestions (experimental)

### Workspace commands:

From the menu, select Extensions > TypeScript.

- Find Symbol

### Usage

#### Screenshots

**Inline errors**

<img src="https://raw.githubusercontent.com/apexskier/nova-typescript/14378cc1fccc752cff1bceef2706f98915966a3b/typescript.novaextension/Images/README/example-error.png" width="400" alt="Example errors">

**Type info on hover**

<img src="https://raw.githubusercontent.com/apexskier/nova-typescript/14378cc1fccc752cff1bceef2706f98915966a3b/typescript.novaextension/Images/README/example-typeinfo.png" width="400" alt="Example type info">

#### Sidebar

The sidebar shows status information about the extension including the version of typescript it's using and if it's started successfully. To access the sidebar, click the “All Sidebars” button. It can be dragged into the sidebar header for quick access.

<img src="https://raw.githubusercontent.com/apexskier/nova-typescript/3cbd2a83f37df63e3e249d16d741ebea82254640/typescript.novaextension/Images/README/example-sidebar.png" width="400" alt="Sidebar information">

#### Find Symbol

Find Symbol performs a project search for a symbol. Results are shown in the sidebar.

<img src="https://raw.githubusercontent.com/apexskier/nova-typescript/fdf669355c7ffcec4a943ebc9de76b45738f08a7/typescript.novaextension/Images/README/example-findsymbol.png" width="400" alt="Find symbol sidebar">

#### Find References

Find References shows all usages of a given variable, function, or other symbol. Results are shown in the sidebar.

<img src="https://user-images.githubusercontent.com/329222/90985881-070b2680-e57f-11ea-83e6-89ab3d4df055.png" width="400" alt="Find references sidebar">

#### Using the workspace version of TypeScript

This extension will automatically find the workspace version of TypeScript installed under `node_modules` in your workspace root. If one isn't installed it will use a recent, bundled version of typescript.

To customize this you can specify the TypeScript library location in workspace preferences (Extensions > TypeScript > Preferences > TypeScript Library) as an absolute or workspace-relative path. This should point to a directory containing the TypeScript `tsserver.js` file, generally ending with `node_modules/typescript/lib`. If installed globally, you can find the installation location using `npm list -g typescript` (e.g. "/usr/local/lib/node_modules/typescript/lib"). (You should only need this if your workspace doesn't install typescript under the workspace's root `node_modules` directory or you use a global installation of TypeScript)
