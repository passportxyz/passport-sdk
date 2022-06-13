const path = require('path')

// Export as two seperate libraries
module.exports = [{
  entry: './src/verifier.ts',
  output: {
    publicPath: './', // this forces the location we attempt to load the .wasm from after build
    path: path.resolve(__dirname, 'dist'),
    filename: 'verifier.bundle.js',
    library: 'PassportVerifier',
    libraryExport: 'PassportVerifier',
    libraryTarget: 'var',
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [
      { 
        test: /.ts$/, 
        use: 'ts-loader' 
      }, {
        test: /\.wasm$/,
        type: 'webassembly/async'
      }
    ]
  },
  experiments: {
    asyncWebAssembly: true,
  }
}];
