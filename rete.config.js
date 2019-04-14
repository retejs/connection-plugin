import sass from 'rollup-plugin-sass';

export default {
    input: 'src/index.ts',
    name: 'ConnectionPlugin',
    plugins: [
        sass({
            insert: true
        })
    ],
    babelPresets: [
        require('@babel/preset-typescript')
    ],
    extensions: ['.js', '.ts'],
    globals: { 'rete': 'Rete' }
}