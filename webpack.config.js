const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    devtool: 'cheap-module-source-map',
    entry: {
        popup: './src/pages/popup/popup.js',
        options: './src/pages/options/options.js',
        background: './src/pages/background/background.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'pages/[name]/[name].js'
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/assets', to: 'assets' }
            ]
        })
    ]
};