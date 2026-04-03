import tseslint from 'typescript-eslint';

export default tseslint.config({
  files: ['public/**/*.js'],
  extends: [tseslint.configs.base],
  languageOptions: {
    parserOptions: {
      project: './jsconfig.json',
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    '@typescript-eslint/no-deprecated': 'warn',
  },
});
