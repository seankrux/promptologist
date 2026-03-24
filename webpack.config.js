const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = argv.mode === 'development';

  return {
    mode: isProduction ? 'production' : 'development',

    entry: {
      background: './background.js',
      content: './content.js',
      popup: './popup.html',
      options: './options.html',
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },

    devtool: isDevelopment ? 'source-map' : isProduction ? 'source-map' : false,

    resolve: {
      extensions: ['.js', '.json'],
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },

    module: {
      rules: [
        // JavaScript/Babel loader
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      browsers: ['chrome >= 90'],
                    },
                    modules: false,
                    useBuiltIns: 'usage',
                    corejs: 3,
                  },
                ],
              ],
              plugins: [
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-proposal-optional-chaining',
                '@babel/plugin-proposal-nullish-coalescing-operator',
              ],
            },
          },
        },
        // CSS loader
        {
          test: /\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                sourceMap: isDevelopment,
                modules: false,
              },
            },
          ],
        },
        // HTML loader for popup and options pages
        {
          test: /\.html$/,
          type: 'asset/resource',
          generator: {
            filename: '[name][ext]',
          },
        },
        // Assets loader
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024,
            },
          },
          generator: {
            filename: 'assets/[name][hash][ext]',
          },
        },
      ],
    },

    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction,
            },
            mangle: true,
            output: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Don't split for Chrome extension (service workers don't support multiple chunks)
          default: false,
          vendors: false,
        },
      },
      usedExports: true,
      sideEffects: false,
    },

    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },

    plugins: [
      // Copy static files (manifest, icons, assets)
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'manifest.json'),
            to: path.resolve(__dirname, 'dist', 'manifest.json'),
          },
          {
            from: path.resolve(__dirname, 'icons'),
            to: path.resolve(__dirname, 'dist', 'icons'),
          },
          {
            from: path.resolve(__dirname, 'assets'),
            to: path.resolve(__dirname, 'dist', 'assets'),
          },
        ],
      }),
      // Custom plugin for Web Worker support in service worker
      {
        apply: (compiler) => {
          compiler.hooks.compilation.tap('WebWorkerPlugin', (compilation) => {
            compilation.hooks.processAssets.tap(
              {
                name: 'WebWorkerPlugin',
                stage: compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
              },
              (assets) => {
                // Preserve Web Worker references in service worker
                Object.keys(assets).forEach((name) => {
                  if (name === 'background.js') {
                    // Ensure Web Worker imports are not mangled
                    // This is handled by Babel configuration
                  }
                });
              }
            );
          });
        },
      },
    ],

    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 3000,
      hot: false, // Chrome extensions don't support hot reload
      liveReload: false,
    },

    stats: {
      env: true,
      outputPath: true,
      timings: true,
      cached: false,
      cachedAssets: false,
      colors: true,
      hash: false,
      modules: false,
      reasons: false,
      source: false,
      publicPath: false,
      performance: true,
      builtAt: true,
      assets: true,
      version: true,
      warnings: true,
      errors: true,
    },
  };
};
