/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  // Run test suites serially — all tests share the same MySQL database
  // and parallel execution causes beforeAll/afterAll table drops to race.
  runInBand: true,
};

module.exports = config;
