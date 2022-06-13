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
    rules: [{ test: /.ts$/, use: 'ts-loader' }]
  },
  experiments: {
    asyncWebAssembly: true
  }
}];
