# Mangrove Streaming Apps

> **WARNING**: Contains private dependencies, can be used as a code sample 

Contains proxima streaming apps to work with [mangrove.exchange](https://mangrove.exchange/) events.

Check out proxima streaming app cli to get started (TODO: add link)

## Apps


## Development

### Requirements

- node.js v14 
- yarn 

### Code Structure

- `./src` - typescript source code
- `./src/**/*.spec.ts` - test files
- `./src/index.ts` - entrypoint to proxima-app-runtime cli

### Setup environment

First you need to have local config file with all services needed for development and testing. 
Config sample can be found [here](https://github.com/proxima-one/dev-configs/blob/master/streaming-app-dev.yml)

To use the config make sure to set environment variable `PROXIMA_APP_CONFIG_PATH`:
```
export PROXIMA_APP_CONFIG_PATH="<local path to your config file>"
```

### Useful commands
- `yarn build` to build source
- `yarn test` to run all tests
- `yarn lint` to run linter
- `yarn start` to run proxima-app-runtime cli
- `yarn start:app <app> <args>` to start apps

Start `parse-blocks` (replace `--id` and `--namespace` arguments to run app in isolated environment) :
```
yarn start:app parse-blocks --id ivandev-mangrove-parse-blocks --source-db kafka-main-prod --source-streams polygon-mumbai-block-index --target-db kafka-dev --app-args '{"addresses": {"mangrove": "0xD27139C60ED051b65c3AEe193BCABFfa1067D243"},"blockIndexer": "remote-polygon-mumbai","network": "polygon-mumbai","startBlock": "23600562","outputStream": "mangrove-events.v1", "initialOffset": "23718950"}'
```
