const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
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
                { from: './src/assets', to: 'assets' },
                { from: './src/pages/popup/popup.html', to: 'pages/popup/popup.html' },
                { from: './src/pages/popup/popup.css', to: 'pages/popup/popup.css' },
                { from: './src/pages/options/options.html', to: 'pages/options/options.html' },
                { from: './src/pages/options/options.css', to: 'pages/options/options.css' }
            ]
        })
    ]
};