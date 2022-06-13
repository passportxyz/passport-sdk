const path = require('path')

// Export as two seperate libraries
module.exports = [{
  entry: './src/reader.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'reader.bundle.js',
    library: 'PassportReader',
    libraryExport: 'PassportReader',
    libraryTarget: 'var'
  },
  resolve: {
    extensions: ['.ts', '.d.ts', '.js', '.json']
  },
  module: {
    rules: [{ test: /.ts$/, use: 'ts-loader' }]
  }
}];
