export const kandel = [
  {
    anonymous: false,
    inputs: [],
    name: "AllAsks",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "AllBids",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract IERC20",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Credit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract IERC20",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Debit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "compoundRateBase",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "compoundRateQuote",
        type: "uint256",
      },
    ],
    name: "SetCompoundRates",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "SetGasprice",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "SetGasreq",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "spread",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "ratio",
        type: "uint256",
      },
    ],
    name: "SetGeometricParams",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "SetLength",
    type: "event",
  },
];
