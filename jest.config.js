module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleFileExtensions: ['js', 'json'],
  collectCoverageFrom: [
    'content.js',
    'background.js',
    '!**/*.test.js',
    '!**/node_modules/**'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.webpack/'
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/utils/setup.js'],
  moduleNameMapper: {
    '^chrome$': '<rootDir>/__tests__/mocks/chromeMock.js'
  },
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true
};
