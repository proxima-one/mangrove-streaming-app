export const forwarder = [
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
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "NewOwnedOffer",
    type: "event",
  },
];
