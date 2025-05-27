import path from 'path';

const { NODE_ENV = 'production' } = process.env;

export default {
    entry: './src/index.ts',
    mode: NODE_ENV,
    target: 'node',
    output: {
        path: path.dirname(new URL(import.meta.url).pathname) + '/dist',
        filename: 'index.js',
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: '/node_modules/',
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
};
