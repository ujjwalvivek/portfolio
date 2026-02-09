const { override, addPostcssPlugins } = require('customize-cra');
const webpack = require('webpack');

module.exports = override(
  addPostcssPlugins([
    require('postcss-import'),
    require('postcss-preset-env')({
      stage: 1,
    }),
    require('postcss-nested'),
    require('autoprefixer'),
    require('cssnano')({
      preset: 'default',
    }),
  ]),
  (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer/'),
      stream: require.resolve('stream-browserify'),
      util: require.resolve('util/'),
    };
    config.plugins = (
      config.plugins || []
    ).concat([
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
    ]);
    return config;
  }
);