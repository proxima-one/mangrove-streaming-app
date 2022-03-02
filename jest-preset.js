module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  globals: {
    "ts-jest": {
      //tsconfig: path.resolve("./tsconfig.json")
    }
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec|e2e))\\.[jt]sx?$",
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    "^.+\\.(css|less|scss)$": "babel-jest"
  }
};

//throw new Error(JSON.stringify(module.exports.moduleNameMapper));
