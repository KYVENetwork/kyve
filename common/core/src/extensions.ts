import Arweave from "arweave";

export const arweaveClient = new Arweave({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});
