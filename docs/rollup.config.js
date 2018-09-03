import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import svelte from "rollup-plugin-svelte";
import uglify from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'
import domprops from 'uglify-es/tools/domprops'

export default [
  {
    input: "src/docs.js",
    output: {
      file: "build/docs.js",
      format: "iife"
    },
    sourcemap: true,
    plugins: [
      resolve({
        module: true,
        browser: true,
        jsnext: true,
        main: true,
        extensions: [".js", ".json"]
      }),
      commonjs(),
      svelte({ cascade: false }),
    uglify({}, minify)
    ]
  }
];
