/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  	preset: 'ts-jest',
  	testEnvironment: 'node',
	clearMocks: true,
	setupFilesAfterEnv: ["<rootDir>/tests/include/Mock.ts"]
};