require("dotenv").config({ silent: true });
import KYVE from "@kyve/core";
import { Pool } from "@kyve/contract-lib";
import Arweave from "arweave";
import SmartWeaveInstance from "@kyve/smartweave";
import fs from "fs";

import * as Sentry from "@sentry/node";
import { RewriteFrames } from "@sentry/integrations";

// This allows TypeScript to detect our global value
declare global {
  namespace NodeJS {
    interface Global {
      __rootdir__: string;
    }
  }
}

global.__rootdir__ = __dirname || process.cwd();

if (process.env.SEND_STATISTICS) {
  // configure sentry
  Sentry.init({
    dsn: "https://2981701aaf29478fb7d397dca2c7f8bc@o768982.ingest.sentry.io/5794635",
    release: "node@" + process.env.npm_package_version,
    integrations: [
      new RewriteFrames({
        root: global.__rootdir__,
      }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
}

const client = new Arweave({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

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
  const instances: KYVE[] = [];

  for (const poolID of Object.keys(config.pools)) {
    const pool = new Pool(client, wallet, poolID);
    const stake = config.pools[poolID];

    // only allowing SmartWeave right now
    instances.push(SmartWeaveInstance(poolID, stake, wallet));
  }

  instances.map((node) => node.run().catch((err) => console.log(err)));
})();

/*
(async () => {
  const state = await contract.getState();
  const pools = state.pools;

  const instances: KYVE[] = [];

  for (const rawID of Object.keys(config.pools)) {
    const poolID = parseFloat(rawID);

    const stake = config.pools[poolID];

    const architecture = pools[poolID].architecture;

    switch (architecture.toLowerCase()) {
      case "avalanche":
        instances.push(AvalancheInstance(poolID.toString(), stake, wallet));
        break;
      case "cosmos":
        instances.push(CosmosInstance(poolID.toString(), stake, wallet));
        break;
      case "polkadot":
        instances.push(PolkadotInstance(poolID.toString(), stake, wallet));
        break;
      case "smartweave":
        instances.push(SmartWeaveInstance(poolID.toString(), stake, wallet));
        break;
      case "solana":
        instances.push(SolanaInstance(poolID.toString(), stake, wallet));
        break;
      case "zilliqa":
        instances.push(ZilliqaInstance(poolID.toString(), stake, wallet));
        break;
      default:
        throw new Error(
          `Unsupported architecture.\n  architecture = ${architecture}`
        );
    }
  }

  instances.map((node) => node.run().catch((err) => console.log(err)));
})();
*/
