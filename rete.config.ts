/* eslint-disable @typescript-eslint/naming-convention */
import { ReteOptions } from 'rete-cli'
import sass from 'rollup-plugin-sass'

export default <ReteOptions>{
  input: 'src/index.ts',
  name: 'ReteConnectionPlugin',
  plugins: [
    sass({
      insert: true
    })
  ],
  globals: {
    'rete': 'Rete',
    'rete-area-plugin': 'ReteAreaPlugin'
  }
}
