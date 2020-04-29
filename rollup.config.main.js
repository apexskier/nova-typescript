import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "src/main.ts",
  plugins: [typescript(), resolve()],
  output: {
    file: "typescript.novaextension/Scripts/main.dist.js",
    sourcemap: true,
    format: "cjs",
  },
};
