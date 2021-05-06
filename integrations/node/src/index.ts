require("dotenv").config({silent: true});
import KYVE from "@kyve/core";
import Contract from "@kyve/contract-lib";
import Arweave from "arweave";
import AvalancheInstance from "@kyve/avalanche";
import CosmosInstance from "@kyve/cosmos";
import PolkadotInstance from "@kyve/polkadot";
import SmartWeaveInstance from "@kyve/smartweave";
import SolanaInstance from "@kyve/solana";
import fs from "fs";

const client = new Arweave({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

const contract = new Contract(client);

let config: any;
if (process.env.CONFIG) {
  config = JSON.parse(fs.readFileSync(process.env.CONFIG).toString());
} else {
  throw new Error("No config provided.");
}

let wallet: any;
if (process.env.WALLET) {
  wallet = JSON.parse(fs.readFileSync(process.env.WALLET).toString());
} else {
  throw new Error("No keyfile provided.");
}

(async () => {
  const state = await contract.getState();
  const pools = state.pools;

  const instances: KYVE[] = [];

  for (const rawID of Object.keys(config.pools)) {
    const poolID = parseFloat(rawID);

    const stake = config.pools[poolID];

    const architecture = pools[poolID].architecture;

    switch (architecture) {
      case "Avalanche":
        instances.push(AvalancheInstance(poolID, stake, wallet));
        break;
      case "Cosmos":
        instances.push(CosmosInstance(poolID, stake, wallet));
        break;
      case "Polkadot":
        instances.push(PolkadotInstance(poolID, stake, wallet));
        break;
      case "SmartWeave":
        instances.push(SmartWeaveInstance(poolID, stake, wallet));
        break;
      case "Solana":
        instances.push(SolanaInstance(poolID, stake, wallet));
        break;
      default:
        throw new Error(
          `Unsupported architecture.\n  architecture = ${architecture}`
        );
    }
  }

  instances.map((node) => node.run().catch((err) => console.log(err)));
})();
