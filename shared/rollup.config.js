import typescript from 'rollup-plugin-typescript2'
const name = require('./package.json').module

export default [
  {
    input: 'src/index.ts',
    plugins: [typescript()],
    output: [
      {
        file: name,
        format: 'es',
        sourcemap: true,
      },
    ],
  }
]
