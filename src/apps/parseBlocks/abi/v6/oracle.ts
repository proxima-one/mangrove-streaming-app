export const oracle = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_governance",
        type: "address",
      },
      { internalType: "address", name: "_initialMutator", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "outbound_tkn",
            type: "address",
          },
          { internalType: "address", name: "inbound_tkn", type: "address" },
          {
            internalType: "uint256",
            name: "offerId",
            type: "uint256",
          },
          { internalType: "Offer.t", name: "offer", type: "uint256" },
          {
            internalType: "uint256",
            name: "wants",
            type: "uint256",
          },
          { internalType: "uint256", name: "gives", type: "uint256" },
          {
            internalType: "OfferDetail.t",
            name: "offerDetail",
            type: "uint256",
          },
          { internalType: "Global.t", name: "global", type: "uint256" },
          {
            internalType: "Local.t",
            name: "local",
            type: "uint256",
          },
        ],
        internalType: "struct MgvLib.SingleOrder",
        name: "sor",
        type: "tuple",
      },
      { internalType: "address", name: "taker", type: "address" },
    ],
    name: "notifyFail",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "outbound_tkn",
            type: "address",
          },
          { internalType: "address", name: "inbound_tkn", type: "address" },
          {
            internalType: "uint256",
            name: "offerId",
            type: "uint256",
          },
          { internalType: "Offer.t", name: "offer", type: "uint256" },
          {
            internalType: "uint256",
            name: "wants",
            type: "uint256",
          },
          { internalType: "uint256", name: "gives", type: "uint256" },
          {
            internalType: "OfferDetail.t",
            name: "offerDetail",
            type: "uint256",
          },
          { internalType: "Global.t", name: "global", type: "uint256" },
          {
            internalType: "Local.t",
            name: "local",
            type: "uint256",
          },
        ],
        internalType: "struct MgvLib.SingleOrder",
        name: "sor",
        type: "tuple",
      },
      { internalType: "address", name: "taker", type: "address" },
    ],
    name: "notifySuccess",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "read",
    outputs: [
      { internalType: "uint256", name: "gasprice", type: "uint256" },
      {
        internalType: "uint256",
        name: "density",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "gasPrice", type: "uint256" }],
    name: "setGasPrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_mutator", type: "address" }],
    name: "setMutator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
