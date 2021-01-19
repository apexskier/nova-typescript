export function wrapCommand(
  // eslint-disable-next-line no-unused-vars
  command: (...args: any[]) => void | Promise<void>
  // eslint-disable-next-line no-unused-vars
): (...args: any[]) => void {
  return async function wrapped(...args: any[]) {
    try {
      await command(...args);
    } catch (err) {
      nova.workspace.showErrorMessage(err);
    }
  };
}

export async function openFile(uri: string) {
  const newEditor = await nova.workspace.openFile(uri);
  if (newEditor) {
    return newEditor;
  }
  console.warn("failed first open attempt, retrying once", uri);
  // try one more time, this doesn't resolve if the file isn't already open. Need to file a bug
  return await nova.workspace.openFile(uri);
}
