import { preferences } from "nova-extension-utils";

const organizeImportsOnSaveKey =
  "apexskier.typescript.config.organizeImportsOnSave";

function reload() {
  nova.commands.invoke("apexskier.typescript.reload");
}
nova.config.onDidChange(organizeImportsOnSaveKey, reload);
nova.workspace.config.onDidChange(organizeImportsOnSaveKey, reload);

export function shouldOrganizeImportsOnSave(): boolean {
  return preferences.getOverridableBoolean(organizeImportsOnSaveKey) ?? false;
}
