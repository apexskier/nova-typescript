// import commonjs from "@rollup/plugin-commonjs";
// import resolve from "@rollup/plugin-node-resolve";
import path from "path";
import typescript from "@rollup/plugin-typescript";

export default {
  input: path.join(__dirname, "src/main.ts"),
  plugins: [typescript()],
  output: {
    file: path.join(__dirname, "../typescript.novaextension/Scripts/main.dist.js"),
    sourcemap: true,
    format: "cjs",
  },
};
