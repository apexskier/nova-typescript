function reload() {
  nova.commands.invoke("apexskier.typescript.reload");
}
nova.config.onDidChange(
  "apexskier.typescript.config.skipDestructiveOrganizeImports",
  reload
);
nova.workspace.config.onDidChange(
  "apexskier.typescript.config.skipDestructiveOrganizeImports",
  reload
);

function getWorkspaceSetting(): boolean | null {
  const str = nova.workspace.config.get(
    "apexskier.typescript.config.skipDestructiveOrganizeImports",
    "string"
  );
  switch (str) {
    case "False":
      return false;
    case "True":
      return true;
    default:
      return null;
  }
}

export function skipDestructiveOrganizeImports(): boolean {
  return (
    getWorkspaceSetting() ??
    nova.config.get(
      "apexskier.typescript.config.skipDestructiveOrganizeImports",
      "boolean"
    ) ??
    true
  );
}
