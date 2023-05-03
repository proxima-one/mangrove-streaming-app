export const mangrove = [
  {
    anonymous: false,
    inputs: [
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
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "OfferRetract",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
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
        indexed: false,
        internalType: "address",
        name: "maker",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "wants",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "gives",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "gasprice",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "gasreq",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "prev",
        type: "uint256",
      },
    ],
    name: "OfferWrite",
    type: "event",
  },
];
