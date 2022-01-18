// eslint-disable-next-line @typescript-eslint/no-var-requires
const tsconfig = require("./tsconfig.json")
// eslint-disable-next-line @typescript-eslint/no-var-requires
const moduleNameMapper = require("tsconfig-paths-jest")(tsconfig)

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
  moduleNameMapper: {
    ...moduleNameMapper,
    "^.+\\.(css|less|scss)$": "babel-jest"
  }
};

//throw new Error(JSON.stringify(module.exports.moduleNameMapper));
