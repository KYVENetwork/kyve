import deepHash from "arweave/node/lib/deepHash";
import Arweave from "arweave";
import ArweaveBundles from "arweave-bundles";

export const arweaveClient = new Arweave({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

export const arweaveBundles = ArweaveBundles({
  utils: Arweave.utils,
  crypto: Arweave.crypto,
  deepHash,
});
