const path = require('path');
const webpack = require('webpack');

const webFallback = {
  // libsodium does not use fs nor path in browsers.
  // These packages are referenced in node environment only
  fs: false,
  path: false,
  // libsodium uses node's crypto as a fallback if it doesn't find any other secure
  // random number generator. In our case `window.crypto` is always available
  crypto: false,

  process: require.resolve('process/browser'),
};

const getTsLoaders = (env) => {
  const tsLoaderCompilerOptions = {
    target: 'es5',
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
        // compile all es libs when included (except core-js-pure ponyfills)
        /node_modules(\\|\/)((?!core-js-pure).).*(\\|\/)es(\\|\/)/,
        // ws lib is es6 (it assumes the users will run it in nodejs directly)
        /node_modules(\\|\/)ws/,
        // supports-color is es6
        /node_modules(\\|\/)supports-color/,
        // they use arrow functions and probably more
        /node_modules(\\|\/)query-string/,
        // they use arrow functions
        /node_modules(\\|\/)chai-as-promised/,
        // they use arrow functions
        /node_modules(\\|\/)chai-exclude/,
        // they use object destructuring
        /node_modules(\\|\/)parse5/,
      ],
    },
  ];
};

const makeBaseConfig = ({ mode, target, devtool, plugins }) => {
  const base = {
    target,
    mode,
    devtool: devtool || (mode === 'development' ? 'inline-source-map' : 'source-map'),

    context: path.resolve(__dirname, '..'),

    output: {
      filename: mode === 'development' ? 'bundle.js' : 'bundle-[chunkhash].js',
      publicPath: '/',
    },

    module: {
      rules: [
        ...getTsLoaders({ target }),
        {
          test: /\.(eot|ttf|woff|woff2|svg|png|jpg)$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 25000,
            },
          },
        },
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
    resolve: {
      extensions: ['.ts', '.js'],
    },
    stats: {
      errorDetails: true,
    },
  };

  if (target === 'web') {
    // 'es5' is necessary to support IE
    base.target = ['web', 'es5'];
    base.resolve.fallback = webFallback;
    base.plugins.push(
      // Node.js Polyfills were removed in Webpack 5
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
    );
  }

  return base;
};

module.exports = { makeBaseConfig };
