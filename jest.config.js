module.exports = {
  setupFilesAfterEnv: ['jest-extended'],
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/config/*.js',
    'src/errors/*.js',
    'src/routes/*.js',
    'src/services/*.js',
    'src/app.js'
  ]
};
