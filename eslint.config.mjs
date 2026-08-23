import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
	},
	...tseslint.configs.recommended,
	// Backend services + shared package
	{
		files: ['services/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'@typescript-eslint/no-explicit-any': 'warn',
			'no-console': 'off',
			eqeqeq: 'error',
			'no-var': 'error',
			'prefer-const': 'warn',
		},
	},
	// Web frontend
	{
		files: ['web/**/*.{ts,tsx}'],
		plugins: {
			react,
			'react-hooks': reactHooks,
		},
		languageOptions: {
			parserOptions: {
				ecmaFeatures: { jsx: true },
			},
		},
		settings: {
			react: { version: 'detect' },
		},
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'@typescript-eslint/no-explicit-any': 'warn',
			'no-console': 'off',
			eqeqeq: 'error',
			'no-var': 'error',
			'prefer-const': 'warn',
			'react/jsx-uses-react': 'error',
			'react/jsx-uses-vars': 'error',
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
		},
	},
);
