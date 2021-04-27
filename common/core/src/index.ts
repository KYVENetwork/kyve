import Arweave from "arweave";
import ArDB from "ardb";
import {
  ListenFunctionReturn,
  UploadFunction,
  UploadFunctionReturn,
  ValidateFunction,
  ValidateFunctionReturn,
} from "./faces";
import { JWKInterface } from "arweave/node/lib/wallet";
import { Observable } from "rxjs";
import { arweaveClient } from "./extensions";

import Contract from "@kyve/contract-lib";
import { GQLEdgeTransactionInterface } from "ardb/lib/faces/gql";
import { untilMined } from "./helper";

export const APP_NAME = "KYVE - DEV";

export default class KYVE {
  public arweave: Arweave = arweaveClient;
  public ardb: ArDB;
  public contract: Contract;

  public uploadFunc: UploadFunction;
  public validateFunc: ValidateFunction;

  // TODO: Write interface for contract.
  // TODO: Refetch!!!
  public pool: any;
  public poolID: number;
  public stake: number;

  private readonly keyfile: JWKInterface;

  constructor(
    options: {
      pool: number;
      stake: number;
      jwk: JWKInterface;
      arweave?: Arweave;
    },
    uploadFunc: UploadFunction,
    validateFunc: ValidateFunction
  ) {
    this.uploadFunc = uploadFunc;
    this.validateFunc = validateFunc;

    this.poolID = options.pool;
    this.keyfile = options.jwk;
    this.stake = options.stake;

    if (options.arweave) {
      this.arweave = options.arweave;
    }

    this.ardb = new ArDB(this.arweave);
    this.contract = new Contract(this.arweave, this.keyfile);
  }

  public async run() {
    const state = await this.contract.getState();
    if (this.poolID >= 0 && this.poolID < state.pools.length) {
      this.pool = state.pools[this.poolID];
      console.log(
        `\nFound pool with name "${this.pool.name}" in the KYVE contract.\n  architecture = ${this.pool.architecture}`
      );
    } else {
      throw Error(
        `No pool with id "${this.poolID}" was found in the KYVE contract.`
      );
    }

    const address = await this.arweave.wallets.getAddress(this.keyfile);

    // check if validator has enough stake
    const currentStake = state.pools[this.poolID].vault[address] || 0;
    const diff = this.stake - currentStake;

    // todo handle case if desired stake is smaller than current stake
    if (diff > 0) {
      const id = await this.contract.lock(this.poolID, diff);
      console.log(
        `Staking ${diff} $KYVE in pool ${this.poolID}.\n Transaction: ${id}`
      );
      await untilMined(id, this.arweave);
      console.log("Successfully staked tokens");
    }

    if (address === this.pool.uploader) {
      console.log("\nRunning as an uploader ...");
      this.uploader();
    } else {
      // register validator
      const id = await this.contract.register(this.poolID);
      console.log(
        `Registering in pool ${this.poolID} as validator.\n Transaction: ${id}`
      );
      await untilMined(id, this.arweave);
      console.log("Successfully registered");

      console.log("\nRunning as a validator ...");
      this.validator();

      process.on("SIGINT", async () => {
        await this.contract.unregister(this.poolID);
        console.log("\nUnregistered");
        process.exit();
      });
    }
  }

  private listener() {
    return new Observable<ListenFunctionReturn>((subscriber) => {
      const main = async (latest: number) => {
        const height = (await this.arweave.network.getInfo()).height;

        console.log(`\n[listener] height = ${height}, latest = ${latest}.`);

        if (latest !== height) {
          const res = (await this.ardb
            .search()
            .min(latest)
            .max(height)
            .from(this.pool.uploader)
            .tag("Application", APP_NAME)
            .tag("Pool", this.poolID.toString())
            .tag("Architecture", this.pool.architecture)
            .findAll()) as GQLEdgeTransactionInterface[];

          console.log(`\n[listener] Found ${res.length} new transactions.`);

          for (const { node } of res) {
            console.log(
              `\n[listener] Parsing transaction.\n  txID = ${node.id}`
            );
            subscriber.next({
              id: node.id,
              transaction: node,
              block: node.block.height,
            });
          }
        }

        setTimeout(main, 150000, height);
      };

      this.arweave.network.getInfo().then((res) => main(res.height));
    });
  }

  private uploader() {
    const node = new Observable<UploadFunctionReturn>((subscriber) =>
      this.uploadFunc(subscriber, this.pool.config)
    );

    node.subscribe((data) => {
      this.pushToArweave(data);
    });
  }

  private async pushToArweave(input: UploadFunctionReturn) {
    const transaction = await this.arweave.createTransaction(
      {
        data: JSON.stringify(input.data),
      },
      this.keyfile
    );

    const tags = [
      { name: "Application", value: APP_NAME },
      { name: "Pool", value: this.poolID.toString() },
      { name: "Architecture", value: this.pool.architecture },
      ...(input.tags || []),
    ];
    for (const { name, value } of tags) {
      transaction.addTag(name, value);
    }

    await this.arweave.transactions.sign(transaction, this.keyfile);
    await this.arweave.transactions.post(transaction);

    console.log(
      `\nSent a transaction\n  txID = ${
        transaction.id
      }\n  cost = ${this.arweave.ar.winstonToAr(transaction.reward)} AR`
    );
  }

  private validator() {
    const node = new Observable<ValidateFunctionReturn>((subscriber) =>
      this.validateFunc(this.listener(), subscriber, this.pool.config)
    );

    node.subscribe((res) => {
      if (res.valid) {
        console.log(`\nSuccessfully validated a block.\n  txID = ${res.id}`);
      } else {
        console.log(`\nFound an invalid block.\n  txID = ${res.id}`);
        this.raiseConcern();
      }
    });
  }

  private async raiseConcern() {
    const id = await this.contract.deny(this.poolID);
    console.log(`\nRaised a dispute in the DAO.\n  txID = ${id}`);
  }
}

export const getData = async (id: string) => {
  const res = await arweaveClient.transactions.getData(id, {
    decode: true,
    string: true,
  });

  return res.toString();
};
