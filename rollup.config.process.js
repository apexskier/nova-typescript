const commonjs = require("@rollup/plugin-commonjs");
const resolve = require("@rollup/plugin-node-resolve");

export default {
  input: "Source/Scripts/process.js",
  plugins: [commonjs(), resolve()],
  output: {
    file: "typescript.novaextension/Scripts/process.dist.js",
    sourcemap: true,
    format: "cjs",
  },
  external: ["webpack"],
};
