// stackoverflow.com/a/51201311
declare module "ipfs-mini" {
  interface IPFSconstructor {
    new (provider: Object): Object;
  }
  const IPFS: IPFSconstructor
  export = IPFS;
}
