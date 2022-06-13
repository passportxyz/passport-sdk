const path = require('path');

module.exports = [{
  entry: './src/index.ts',
  output: {
    publicPath: '',
    path: path.resolve(__dirname, 'dist'),
    filename: 'writer.bundle.js',
    library: 'PassportWriter',
    libraryExport: 'PassportWriter',
    libraryTarget: 'var'
  },
  resolve: {
    extensions: ['.ts', '.d.ts', '.js', '.json']
  },
  module: {
    rules: [
      { 
        test: /.ts$/, 
        loader: 'ts-loader', 
        options: { 
          allowTsInNodeModules: true 
        },
        exclude: /\.d\.ts$/
      },
      {
        test: /\.d\.ts$/,
        loader: 'ignore-loader'
      },
    ]
  },
}];
