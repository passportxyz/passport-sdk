const path = require('path');

module.exports = [{
  entry: './src/index.ts',
  output: {
    publicPath: '',
    path: path.resolve(__dirname, 'dist'),
    filename: 'writer.bundle.js',
    library: 'PassportWriter',
    libraryExport: 'PassportWriter',
    libraryTarget: 'commonjs2',
  },
  resolve: {
    extensions: ['.ts', '.d.ts', '.js', '.json']
  },
  module: {
    rules: [
      {
        test: /\.d\.ts$/,
        loader: 'ignore-loader'
      },
      { 
        test: /.tsx?$/, 
        loader: 'ts-loader', 
        exclude: /node_modules|\.d\.ts$/
      }
    ]
  },
}];
