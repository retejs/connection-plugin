import typescript from '@rollup/plugin-typescript';
import sass from 'rollup-plugin-sass';

export default {
    input: 'src/index.ts',
    name: 'ConnectionPlugin',
    plugins: [
        sass({
            insert: true
        }),
        typescript()
    ],
    babelPresets: [
        require('@babel/preset-typescript')
    ],
    extensions: ['.js', '.ts'],
    globals: { 'rete': 'Rete' }
}