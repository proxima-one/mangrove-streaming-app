# Mangrove Streaming Apps

Contains proxima streaming apps to work with [mangrove.exchange](https://mangrove.exchange/) events.

Check out proxima streaming app cli to get started (TODO: add link)

## Apps

### eth-connector

Connects any given eth-like network by producing block headers stream

#### Arguments
```json
{
  "outputStream": "eth-main-blockheaders", // required! stream to produce block headers to
  "network": "eth-main", // required! network name from the config file
  "maxReorgDepth": "50", // maximum tolerated chain reorganization depth
  "blockTimeout": "100000", // timeout in ms to receive next block from the network
  "buffer": "50000" // block headers buffer size
}
```

### eth-block-indexer

Indexes ethereum blockchain by consuming block headers source stream and fetching all transactions (input + receipt) from
the network. Produces new streaming containing block headers and reference to an index location. Indexes are 
stored by a given BlockIndexer. 

#### Arguments
```json
{
  "outputStream": "eth-main-block-index", // stream to produce block headers to, default: "block-index"
  "network": "eth-main", // required! network name from the config file
  "blockIndexer": "eth-main", // required! block indexer name from the config file
  
  // next arguments common for other processes as well
  "readBuffer": "10000", // buffer size for source events
  "batch": "1000", // max batch size to process source events
  
  // optional storage for state snapshots
  "snapshot": {
    "storage": "main-snapshots", // storage name from the config file
    "interval": "100000", // how many source events should be processed to snapshot the state 
  },
}
```
### eth-block-checker

Checks input block events stream for consistency. If the state is inconsistent - stops processing and output error messages.

#### Arguments
```json
{
  "eventType": "blockHeader", // required! currently supported only next event streams: "blockHeader" and "blockIndex" 
  
  // next arguments common for other processes as well
  "readBuffer": "10000", // buffer size for source events
  "batch": "1000", // max batch size to process source events
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

Start `eth-connector` (replace `--id` and `--namespace` arguments to run app in isolated environment) :
```
yarn start:app eth-connector --id dev.connect-eth --target-db kafka-dev --namespace dev --app-args '{ "outputStream": "eth-main-blockheaders", "network": "eth-main" }'
```
Start `eth-block-indexer` (replace `--id` and `--namespace` arguments to run app in isolated environment) :
```
yarn start:app eth-block-indexer --id ivandev-eth-block-index --source-db kafka-dev --source-streams ivandev-eth-main-blockheaders2 --target-db kafka-dev --namespace ivandev --app-args '{"network": "eth-main", "blockIndexer": "eth-main-local-dev"}'
```
Start `eth-block-checker` (replace `--id` and `--namespace` arguments to run app in isolated environment) :
```
yarn start:app eth-block-checker --id eth-block-checker.eth-main-headers --source-db kafka-dev --source-streams ivandev-eth-main-blockheaders2 --target-db kafka-dev --app-args '{"eventType": "blockHeader"}'
```


