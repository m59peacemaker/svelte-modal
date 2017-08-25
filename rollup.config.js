import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import svelte from 'rollup-plugin-svelte'

const Plugins = () => [
  resolve({
    module: true, browser: true, jsnext: true, main: true, extensions: [ '.js', '.json' ]
  }),
  commonjs(),
  svelte()
]

export default [
  {
    entry: 'src/Modal.html',
    dest: 'build/Modal.js',
    format: 'es',
    plugins: Plugins()
  },

  {
    entry: 'src/Modal.html',
    dest: 'build/Modal.cjs.js',
    format: 'cjs',
    plugins: Plugins()
  }
]
