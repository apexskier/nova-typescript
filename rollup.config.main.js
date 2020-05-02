import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";

// NOTE: this works, but has a couple issues.
// 
// cache issues, such as the following
// ```
// [!] (plugin rpt2) Error: ENOENT: no such file or directory, open '/Users/cameronlittle/Dev/nova-typescript/node_modules/.cache/rollup-plugin-typescript2/rpt2_b2ffe25927fdf3bdfc6af7cc34cbf7c51560889e/code/cache_/dff2aa675eb1f7c9d04145fc75469e189b910ce5'
// ```
//
// it doesn't use the same type resolution as tsc, which has conflicts with @types/node
//
// I'm going to wait until my nova-editor types PR is merged before attempting to fix fully

export default {
  input: "src/main.ts",
  plugins: [typescript(), resolve()],
  output: {
    file: "typescript.novaextension/Scripts/main.dist.js",
    sourcemap: true,
    format: "cjs",
  },
};
