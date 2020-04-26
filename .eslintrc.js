module.exports = {
	plugins: ['nova'],
	env: {
		commonjs: true,
		es6: true,
		node: true,
		'nova/nova': true,
	},
	extends: 'eslint:recommended',
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module',
	},
	rules: {},
};
