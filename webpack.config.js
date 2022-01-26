const path = require('path')
// webpack.config.js
const Dotenv = require('dotenv-webpack');

module.exports = {
    mode: "development",
    entry: {
        app: "./src/app.ts"
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', 'tsx', '.js']
    },
    devtool: 'source-map',
    plugins: [
        new Dotenv()
    ],
    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: 'ts-loader',
            exclude: /node_modules/
        }]
    }
}
