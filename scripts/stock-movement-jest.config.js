process.env.NODE_ENV = 'test';

module.exports = {
    rootDir: '..',
    roots: ['<rootDir>/src'],
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/src/pages/StockMovement.test.js'],
    transform: { '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['babel-preset-react-app'] }] }
};
