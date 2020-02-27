module.exports = {
  env: {
    test: {
      presets: [
        [
          "@babel/preset-env",
          {
            targets: {
              node: "current"
            }
          }
        ]
      ],
      plugins: ["transform-es2015-modules-commonjs"]
    }
  },
  plugins: ["@babel/plugin-syntax-dynamic-import"]
};
