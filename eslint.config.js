module.exports = [
	{
		ignores: ['**/node_modules/**', '**/dist/**', '**/build/**'],
	},
	// Backend services
	{
		files: ['services/**/*.ts'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
		},
		rules: {
			'no-unused-vars': 'off',
			'no-console': 'off',
			eqeqeq: 'error',
			'no-var': 'error',
			'prefer-const': 'warn',
		},
	},
	// Web frontend
	// TODO: react stuff
	{
		files: ['web/**/*.ts', 'web/**/*.tsx'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		rules: {
			'no-unused-vars': 'off',
			'no-console': 'off',
			eqeqeq: 'error',
			'no-var': 'error',
			'prefer-const': 'warn',
		},
	},
	// this config
	{
		files: ['eslint.config.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'commonjs',
			globals: {
				module: 'readonly',
				require: 'readonly',
				__dirname: 'readonly',
			},
		},
	},
];
