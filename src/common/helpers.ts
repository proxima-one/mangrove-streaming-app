export function getMangroveVersion(args: any) {
  if (!!args.addresses.mangrove8 && !!args.addresses.mangrove9)
    throw new Error("Only one mangrove address can be specified.");

  if (args.addresses.mangrove8) return "mangrove8";
  else if (args.addresses.mangrove9) return "mangrove9";
  throw new Error("Mangrove address is not specified.");
}
