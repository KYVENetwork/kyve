module.exports = {
  hooks: {
    "pre-commit": 'lint-staged && npx --no-install commitlint --edit "$1"',
  },
};
