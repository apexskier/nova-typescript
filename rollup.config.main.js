// import commonjs from "@rollup/plugin-commonjs";
// import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/main.ts",
  plugins: [typescript()],
  output: {
    file: "typescript.novaextension/Scripts/main.dist.js",
    sourcemap: true,
    format: "cjs",
  },
};
