import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/process.ts",
  plugins: [typescript()],
  output: {
    file: "typescript.novaextension/Scripts/process.dist.js",
    sourcemap: true,
    format: "cjs",
  },
};
