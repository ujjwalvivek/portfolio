const { override, addPostcssPlugins } = require('customize-cra');

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
  ])
);