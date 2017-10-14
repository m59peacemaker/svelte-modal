import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import svelte from 'rollup-plugin-svelte'
import closure from 'rollup-plugin-closure-compiler-js'

const Plugins = () => [
  resolve({
    module: true, browser: true, jsnext: true, main: true, extensions: [ '.js', '.json' ]
  }),
  commonjs(),
  svelte({ cascade: false }),
  closure({
    languageIn: 'ECMASCRIPT6',
    languageOut: 'ECMASCRIPT5',
    compilationLevel: 'ADVANCED',
    warningLevel: 'VERBOSE',
    externs: [
      // { src: `const global = window` }
    ]
  })
]

export default [
  {
    input: 'src/docs.js',
    output: {
      file: 'build/docs.js',
      format: 'iife',
    },
    plugins: Plugins()
  }
]
