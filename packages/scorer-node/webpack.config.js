const path = require('path')

module.exports = [{
  entry: './src/scorer.ts',
  output: {
    publicPath: '',
    path: path.resolve(__dirname, 'dist'),
    filename: 'scorer.bundle.js',
    library: 'PassportScorer',
    libraryExport: 'PassportScorer',
    libraryTarget: 'var'
  },
  resolve: {
    extensions: ['.ts', '.d.ts', '.js', '.json']
  },
  module: {
    rules: [{ 
      test: /.ts$/, 
      loader: 'ts-loader', 
      options: { 
        allowTsInNodeModules: true 
      },
      exclude: /\.d\.ts$/
    }, {
      test: /\.d\.ts$/,
      loader: 'ignore-loader'
    }, {
      test: /\.wasm$/,
      type: 'webassembly/async'
    }]
  },
  experiments: {
    asyncWebAssembly: true
  }
}];
