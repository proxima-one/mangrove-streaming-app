export const orderLogic = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
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
        internalType: "address",
        name: "taker",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "fillOrKill",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "takerWants",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "takerGives",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "fillWants",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "restingOrder",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "expiryDate",
        type: "uint256",
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
        name: "bounty",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fee",
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
        name: "offerId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "date",
        type: "uint256",
      },
    ],
    name: "SetExpiry",
    type: "event",
  },
];