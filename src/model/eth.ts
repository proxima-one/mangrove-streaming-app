export type Address = string;
export type UInt = string;
export type Hash = string;
export type BlockNumber = number;
export type Int = string;

export type TransactionRef = {
  blockNumber: BlockNumber;
  blockHash: Hash;
  txHash: Hash;
  from: Address;
};
