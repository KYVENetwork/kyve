require("dotenv").config({ silent: true });
import KYVE from "@kyve/core";
import { Pool } from "@kyve/contract-lib";
import Arweave from "arweave";
import SmartWeaveInstance from "@kyve/smartweave";
import CosmosInstance from "@kyve/cosmos";
import EVMInstance from "@kyve/evm";
import EVMEventsInstance from "@kyve/evm-events";
import PolkadotInstance from "@kyve/polkadot";
import SolanaInstance from "@kyve/solana";
import SolanaSnapshotsInstance from "@kyve/solana-snapshots";
import ZilliqaInstance from "@kyve/zilliqa";
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

  // enriching exceptions with user context
  Sentry.setUser({ email: process.env.MAINTAINER, username: process.env.NAME });
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
  throw new Error(
    "No CONFIG in .env file specified. Please check if your .env file is in the node directory."
  );
}

let wallet: any;
if (process.env.WALLET) {
  wallet = JSON.parse(fs.readFileSync(process.env.WALLET).toString());
} else {
  throw new Error(
    "No WALLET in .env file specified. Please check if your .env file is in the node directory."
  );
}

(async () => {
  const instances: KYVE[] = [];

  for (const poolID of Object.keys(config.pools)) {
    const stake = config.pools[poolID];

    // get pool runtime
    const pool = new Pool(client, wallet, poolID);
    const state = await pool.getState();
    const runtime = state.settings.runtime;

    // select correct instance based of the runtime
    switch (runtime) {
      case "@kyve/cosmos":
        instances.push(CosmosInstance(poolID, stake, wallet));
        break;
      case "@kyve/evm":
        instances.push(EVMInstance(poolID, stake, wallet));
        break;
      case "@kyve/evm-events":
        instances.push(EVMEventsInstance(poolID, stake, wallet));
        break;
      case "@kyve/polkadot":
        instances.push(PolkadotInstance(poolID, stake, wallet));
        break;
      case "@kyve/smartweave":
        instances.push(SmartWeaveInstance(poolID, stake, wallet));
        break;
      case "@kyve/solana":
        instances.push(SolanaInstance(poolID, stake, wallet));
        break;
      case "@kyve/solana-snapshots":
        instances.push(SolanaSnapshotsInstance(poolID, stake, wallet));
        break;
      case "@kyve/zilliqa":
        instances.push(ZilliqaInstance(poolID, stake, wallet));
        break;
      default:
        throw new Error(`Unsupported runtime: ${runtime}`);
    }
  }

  instances.map((node) =>
    node.run().catch((err) => {
      if (process.env.SEND_STATISTICS) {
        Sentry.captureException(err);
      }
      console.log(err);
    })
  );
})();
