export const takerStrategy = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract IMangrove",
        name: "mangrove",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "base",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "quote",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "taker",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "selling",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "takerGot",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "takerGave",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "penalty",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "restingOrderId",
        type: "uint256",
      },
    ],
    name: "OrderSummary",
    type: "event",
  },
];
