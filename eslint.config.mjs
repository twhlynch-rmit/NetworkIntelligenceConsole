import eslintReact from '@eslint-react/eslint-plugin';
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
		extends: [eslintReact.configs['recommended-typescript']],
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
);
