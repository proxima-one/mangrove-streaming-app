export const seeder = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "contract IERC20",
        name: "base",
        type: "address",
      },
      {
        indexed: true,
        internalType: "contract IERC20",
        name: "quote",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "aaveKandel",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "reserveId",
        type: "address",
      },
    ],
    name: "NewAaveKandel",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "contract IERC20",
        name: "base",
        type: "address",
      },
      {
        indexed: true,
        internalType: "contract IERC20",
        name: "quote",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "kandel",
        type: "address",
      },
    ],
    name: "NewKandel",
    type: "event",
  },
];
