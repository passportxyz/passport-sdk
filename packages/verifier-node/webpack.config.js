const path = require("path");

// Export as two seperate libraries
module.exports = [
  {
    entry: "./src/verifier.ts",
    output: {
      publicPath: "./", // this forces the location we attempt to load the .wasm from after build
      path: path.resolve(__dirname, "dist"),
      filename: "verifier.bundle.js",
      library: "PassportVerifier",
      libraryExport: "PassportVerifier",
      libraryTarget: "var",
    },
    resolve: {
      extensions: [".ts", ".js", ".json"],
      fallback: {
        path: false,
        fs: false,
      },
    },
    module: {
      rules: [
        {
          test: /.ts$/,
          loader: "ts-loader",
          options: {
            allowTsInNodeModules: true,
          },
          exclude: /\.d\.ts$/,
        },
        {
          test: /\.d\.ts$/,
          loader: "ignore-loader",
        },
        {
          test: /\.wasm$/,
          type: "webassembly/async",
        },
      ],
    },
    experiments: {
      asyncWebAssembly: true,
    },
  },
];
