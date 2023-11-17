// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: "./src/editor.mjs",
    output: {
        file: "./dist/editor.bundle.js",
        format: "iife",
        name: 'editor' // Replace with your desired name
    },
    plugins: [
        resolve(),
        commonjs()
    ]
}