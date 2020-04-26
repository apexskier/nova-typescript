const client = new LanguageClient(
	'apexskier.typescript',
	'Typescript Language Server',
	{
		type: 'stdio',
		path: `${nova.extension.path}/run.sh`,
	},
	{
		syntaxes: ['typescript'],
	}
);

export function activate() {
	console.log('activating...');
	client.start();
}

export function deactivate() {
	client.stop();
}
