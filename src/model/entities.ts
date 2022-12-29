import { EthModel } from "@proxima-one/proxima-plugin-eth";

export function mangroveId(chain: string, address: string): string {
  return `${chain}-${address.substring(0, 6)}`;
}

export function orderId(
  txHash: EthModel.Hash,
  orderCompleteLog: EthModel.DecodedLog
) {
  return `${txHash.toHexString()}-${orderCompleteLog.index}`;
}
