const path = require('path');
const webpack = require('webpack');

const webResolve = {
  fallback: {
    // libsodium does not use fs nor path in browsers.
    // These packages are referenced in node environment only
    fs: false,
    path: false,
    // libsodium uses node's crypto as a fallback if it doesn't find any other secure
    // random number generator. In our case `window.crypto` is always available
    crypto: false,

    // Node.js polyfills were removed from default behavior in Webpack 5
    // But buffer and process.nextTick are used in `readable-stream` see the README:
    // - https://github.com/nodejs/readable-stream#usage-in-browsers
    buffer: require.resolve('buffer/'),
    process: require.resolve('process/browser'),
  },
};

const getTsLoaders = (env) => {
  const tsLoaderCompilerOptions = {
    target: 'es2019',
    declaration: false,
    declarationMap:false,
    sourceMap: false,
    declarationDir: undefined,
    composite: false,
    declaration: false,
    importHelpers: true,
    downlevelIteration: true,
  };

  return [
    {
      test: /\.tsx?$/,
      loader: 'ts-loader',
      options: {
        configFile: path.resolve(__dirname, 'tsconfig.tests.json'),
        compilerOptions: tsLoaderCompilerOptions,
      },
      exclude: /node_modules|\.d\.ts$/,
    },
    {
      test: /\.js$/,
      loader: 'ts-loader',
      options: {
        configFile: path.resolve(__dirname, 'tsconfig.base.json'),
        compilerOptions: {
          ...tsLoaderCompilerOptions,
          allowJs: true,
        },
      },
      include: [
        // they use arrow functions and probably more
        /node_modules(\\|\/)query-string/,
        // they use arrow functions
        /node_modules(\\|\/)chai-as-promised/,
        // they use arrow functions
        /node_modules(\\|\/)chai-exclude/,
      ],
    },
  ];
};

const makeBaseConfig = ({ mode, target, devtool, plugins }) => {
  const base = {
    target,
    mode,

    context: path.resolve(__dirname, '..'),

    output: {
      filename: mode === 'development' ? 'bundle.js' : 'bundle-[chunkhash].js',
      publicPath: '/',
      // the default function (md4) is not supported by OpenSSL by default starting in Node 17
      hashFunction: 'xxhash64',
    },

    module: {
      rules: [
        ...getTsLoaders({ target }),
      ],
    },

    plugins: [
      // Always expose NODE_ENV to webpack, in order to use `process.env.NODE_ENV`
      // inside your code for any environment checks; Terser will automatically
      // drop any unreachable code.
      new webpack.EnvironmentPlugin({ NODE_ENV: mode }),
      new webpack.WatchIgnorePlugin({
        paths: [
          /\.js$/,
          /\.d\.ts$/,
        ],
      }),
      ...(plugins || []),
    ],

    node: undefined,
    devServer: undefined,
    stats: {
      errorDetails: true,
    },
  };

  if (target === 'web') {
    base.target = ['web', 'es2019'];
    base.resolve = webResolve;
    base.plugins.push(
      // Node.js Polyfills were removed in Webpack 5
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
    );
  }

  base.resolve = {
    ...base.resolve,
    alias: {
      '@tanker/test-utils': path.resolve(__dirname, '../packages/test-utils/src/index.ts'),
      '@tanker/identity': path.resolve(__dirname, '../packages/identity/src/index.ts'),
    },
    extensions: ['.ts', '.js'],
  };

  return base;
};

module.exports = { makeBaseConfig };
