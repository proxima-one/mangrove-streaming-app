export const kandel = [
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
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "contract IMangrove",
        name: "mgv",
        type: "address",
      },
    ],
    name: "Mgv",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "contract IERC20",
        name: "base",
        type: "address",
      },
      {
        indexed: false,
        internalType: "contract IERC20",
        name: "quote",
        type: "address",
      },
    ],
    name: "Pair",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reserveId",
        type: "address",
      },
    ],
    name: "SetReserveId",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "contract AbstractRouter",
        name: "router",
        type: "address",
      },
    ],
    name: "SetRouter",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "admin",
        type: "address",
      },
    ],
    name: "SetAdmin",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "enum OfferType",
        name: "ba",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "offerId",
        type: "uint256",
      },
    ],
    name: "SetIndexMapping",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "PopulateEnd",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "PopulateStart",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "RetractEnd",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "RetractStart",
    type: "event",
  },
];
