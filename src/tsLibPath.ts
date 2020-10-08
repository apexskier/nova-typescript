import { dependencyManagement } from "nova-extension-utils";

function reload() {
  nova.commands.invoke("apexskier.typescript.reload");
}
nova.config.onDidChange("apexskier.typescript.config.tslibPath", reload);
nova.workspace.config.onDidChange(
  "apexskier.typescript.config.tslibPath",
  reload
);

// this determines which version of typescript is being run
// it should be project specific, so find the best option in this order:
// - explicitly configured
// - best guess (installed in the main node_modules)
// - within plugin (no choice of version)
export function getTsLibPath(): string | null {
  let tslibPath: string;
  const configTslib =
    nova.workspace.config.get(
      "apexskier.typescript.config.tslibPath",
      "string"
    ) ?? nova.config.get("apexskier.typescript.config.tslibPath", "string");
  if (configTslib) {
    if (nova.path.isAbsolute(configTslib)) {
      tslibPath = configTslib;
    } else if (nova.workspace.path) {
      tslibPath = nova.path.join(nova.workspace.path, configTslib);
    } else {
      nova.workspace.showErrorMessage(
        "Save your workspace before using a relative TypeScript library path."
      );
      return null;
    }
  } else if (
    nova.workspace.path &&
    nova.fs.access(
      nova.path.join(nova.workspace.path, "node_modules/typescript/lib"),
      nova.fs.F_OK
    )
  ) {
    tslibPath = nova.path.join(
      nova.workspace.path,
      "node_modules/typescript/lib"
    );
  } else {
    tslibPath = nova.path.join(
      dependencyManagement.getDependencyDirectory(),
      "node_modules/typescript/lib"
    );
  }
  if (!nova.fs.access(tslibPath, nova.fs.F_OK)) {
    if (configTslib) {
      nova.workspace.showErrorMessage(
        "Your TypeScript library couldn't be found, please check your settings."
      );
    } else {
      console.error("typescript lib not found at", tslibPath);
    }
    return null;
  }

  return tslibPath;
}
