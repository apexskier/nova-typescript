const commonjs = require("@rollup/plugin-commonjs");
const resolve = require("@rollup/plugin-node-resolve");

export default {
  input: "Source/Scripts/main.js",
  plugins: [commonjs(), resolve()],
  output: {
    file: "typescript.novaextension/Scripts/main.dist.js",
    sourcemaps: true,
    format: "cjs",
  },
};
