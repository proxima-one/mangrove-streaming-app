# Mangrove Streaming Apps

> **WARNING**: Contains private dependencies, can be used as a code sample 

Contains proxima streaming apps to work with [mangrove.exchange](https://mangrove.exchange/) events.

Check out proxima streaming app cli to get started (TODO: add link)

## Apps

### parse-blocks

Parses the mangrove's main contract. This parser is complex since custom callback can be executed after all offers in
the order taken. This custom callback may also start new order in the same Mangrove contract, so we have to parse it
recursively while preserving order


#### Arguments
```json
{
  "batch": 500,
  "readBuffer": 10000,
  "db": "core-us",
  "output": {
    "default": "proxima.mangrove.polygon-mumbai.0xad90.tokens.0_1"
  },
  "stateManager": "main",
  "input": {
    "default": {
      "id": "proxima.mangrove.polygon-mumbai.0xad90.domain-events.0_1"
    }
  },
  "network":
  "polygon-mumbai"
}
```

### strategies

Finds `NewOwnedOffer`, `OrderComplete`, `LogIncident`, `OrderSummary`, `SetExpiry` logs using autodiscovery mechanism.
Maps these logs to the output stream events without aggregation

#### Arguments
```json
{
  "batch": 500,
  "readBuffer": 10000,
  "db": "core-us",
  "output": {
    "default": "proxima.mangrove.polygon-mumbai.strategies.0_5"
  },
  "stateManager": "main",
  "input": {
    "default": {
      "id": "proxima.polygon-mumbai.blocks-sync.1_0",
      "startHeight":29969278
    }
  },
  "network": "polygon-mumbai",
  "chainlistId":80001,
  "startBlock":29969378,
  "blockIdInput":true
}
```

### tokens

Contains ERC-20 tokens that are used in the main mangrove stream. Takes main mangrove stream as an input

#### Arguments
```json
{
  "batch": 500,
  "readBuffer": 10000,
  "db": "core-us",
  "output": {
    "default": "proxima.mangrove.polygon-mumbai.0xad90.tokens.0_1"
  },
  "stateManager":"main",
  "input": {
    "default": {
      "id": "proxima.mangrove.polygon-mumbai.0xad90.domain-events.0_1"
    }
  },
  "network": "polygon-mumbai"
}
```


### kandel

Aggregates Kandel events

#### Arguments
```json
{
  "batch": 500,
  "readBuffer": 10000,
  "db": "core-us-stage",
  "output": {
    "default": "proxima.mangrove.polygon-mumbai.0xad90.kandel.0_6"
  },
  "stateManager": "main",
  "input": {
    "default": {
      "id":"proxima.polygon-mumbai.blocks-sync.1_0",
      "startHeight":33665942,
      "db":"core-us"
    }
  },
  "network":"polygon-mumbai",
  "addresses": {
    "mangrove8": "0xAd90a2a9BdcB630c976CaceA1253D89edf74da5e"
  },
  "chainlistId":80001,
  "startBlock":"33666042",
  "blockIdInput":true
}
```

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
yarn start:app parse-blocks --id ivandev-mangrove-parse-blocks --source-db kafka-main-prod --source-streams polygon-mumbai-block-index --target-db kafka-dev --app-args '{"addresses": {"mangrove": "0x6f531931A7EaefB95307CcD93a348e4C27F62DCF"},"blockIndexer": "remote-polygon-mumbai","network": "polygon-mumbai","startBlock": "23600562","outputStream": "mangrove-events.v1", "initialOffset": "24258823"}'
```
