import sass from 'rollup-plugin-sass';

export default {
    input: 'src/index.js',
    name: 'ConnectionPlugin',
    plugins: [
        sass({
            insert: true
        })
    ],
    output: {
        globals: [
            'Path'
        ]
    },
    external: [
        'svg-path-generator'
    ]
}

