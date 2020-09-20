function reload() {
  nova.commands.invoke("apexskier.typescript.reload");
}
nova.config.onDidChange(
  "apexskier.typescript.config.isEnabledForJavascript",
  reload
);
nova.workspace.config.onDidChange(
  "apexskier.typescript.config.isEnabledForJavascript",
  reload
);

function getWorkspaceSetting(): boolean | null {
  const str = nova.workspace.config.get(
    "apexskier.typescript.config.isEnabledForJavascript",
    "string"
  );
  switch (str) {
    case "Disable":
      return false;
    case "Enable":
      return true;
    default:
      return null;
  }
}

export function isEnabledForJavascript(): boolean {
  return (
    getWorkspaceSetting() ??
    nova.config.get(
      "apexskier.typescript.config.isEnabledForJavascript",
      "boolean"
    ) ??
    true
  );
}
