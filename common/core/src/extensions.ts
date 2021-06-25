import deepHash from "arweave/node/lib/deepHash";
import Arweave from "arweave";
import ArweaveBundles from "arweave-bundles";

export const arweaveClient = new Arweave({
  host: "localhost",
  port: 1984,
  protocol: "http",
});

export const arweaveBundles = ArweaveBundles({
  utils: Arweave.utils,
  crypto: Arweave.crypto,
  deepHash,
});
