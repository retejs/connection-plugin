import tseslint from 'typescript-eslint';
import configs from 'rete-cli/eslint.config.mjs';
import gloals from 'globals'

export default tseslint.config(
  ...configs,
  {
    languageOptions: {
      globals: {
        ...gloals.browser
      }
    }
  }
)