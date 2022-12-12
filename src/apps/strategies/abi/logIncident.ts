export const logIncident = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract IMangrove",
        name: "mangrove",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "outbound_tkn",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "inbound_tkn",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "offerId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "makerData",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "mgvData",
        type: "bytes32",
      },
    ],
    name: "LogIncident",
    type: "event",
  },
];
