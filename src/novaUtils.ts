export function wrapCommand(
  command: (...args: any[]) => void
): (...args: any[]) => void {
  return function wrapped(...args: any[]) {
    try {
      command(...args);
    } catch (err) {
      nova.workspace.showErrorMessage(err);
    }
  };
}

export async function openFile(uri: string) {
  let newEditor = await nova.workspace.openFile(uri);
  if (newEditor) {
    return newEditor;
  }
  console.warn("failed first open attempt, retrying once", uri);
  // try one more time, this doesn't resolve if the file isn't already open. Need to file a bug
  newEditor = await nova.workspace.openFile(uri);
  if (newEditor) {
    return newEditor;
  }
  return null;
}
