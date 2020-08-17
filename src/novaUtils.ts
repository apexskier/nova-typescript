export function wrapCommand(
  command: (...args: any[]) => void | Promise<void>
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

export async function showChoicePalette<T>(
  choices: T[],
  choiceToString: (choice: T) => string,
  options?: { placeholder?: string }
) {
  const index = await new Promise<number | null>((resolve) =>
    nova.workspace.showChoicePalette(
      choices.map(choiceToString),
      options,
      (_, index) => {
        resolve(index);
      }
    )
  );
  if (index == null) {
    return null;
  }
  return choices[index];
}
