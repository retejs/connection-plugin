import { ReteOptions } from 'rete-cli'
import sass from 'rollup-plugin-sass'

export default <ReteOptions>{
    input: 'src/index.ts',
    name: 'ConnectionPlugin',
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
