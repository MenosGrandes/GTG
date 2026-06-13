module.exports = {
  testEnvironment: "jsdom",
  testTimeout: 60000,
  transform: {
    "^.+\\.[jt]sx?$": ["@swc/jest"],
  },
  moduleFileExtensions: ["js", "jsx"],
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
};
