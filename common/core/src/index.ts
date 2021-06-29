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
import { arweaveBundles as bundles, arweaveClient } from "./extensions";

import { Pool } from "@kyve/contract-lib";
import { GQLEdgeTransactionInterface } from "ardb/lib/faces/gql";
import { untilMined } from "./helper";

export const APP_NAME = "KYVE - DEV";

export default class KYVE {
  public arweave: Arweave = arweaveClient;
  public ardb: ArDB;
  public contract: Pool;
  public APP_NAME: string = APP_NAME;

  public uploadFunc: UploadFunction;
  public validateFunc: ValidateFunction;
  private uploaderBuffer: UploadFunctionReturn[] = [];
  private validatorBuffer: ValidateFunctionReturn[] = [];

  public poolID: string;
  public stake: number;

  protected keyfile: JWKInterface;

  protected dryRun: boolean = false;

  constructor(
    options: {
      pool: string;
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
    this.contract = new Pool(this.arweave, this.keyfile, options.pool);
  }

  public async run() {
    const state = await this.contract.getState();

    // shut down if no uploader is selected
    if (!state.settings.uploader) {
      throw new Error(
        "No uploader specified in pool. Please create a vote to elect an uploader."
      );
    }

    const address = await this.arweave.wallets.getAddress(this.keyfile);

    // check if node has enough stake
    const currentStake = state.credit[address].stake;
    const diff = Math.abs(this.stake - currentStake);

    if (this.stake === currentStake) {
      console.log(
        `Already staked with ${this.stake} $KYVE in pool ${this.poolID}.`
      );
    } else if (this.stake > currentStake) {
      const id = await this.contract.stake(diff);
      console.log(
        `Staking ${diff} $KYVE in pool ${this.poolID}.\n Transaction: ${id}`
      );
      await untilMined(id, this.arweave);
      console.log("Successfully staked tokens");
    } else {
      const id = await this.contract.unstake(diff);
      console.log(
        `Unstaking ${diff} $KYVE in pool ${this.poolID}.\n Transaction: ${id}`
      );
      await untilMined(id, this.arweave);
      console.log("Successfully unstaked tokens");
    }

    if (address === state.settings.uploader) {
      console.log("\nRunning as an uploader ...");
      this.uploader();
    } else {
      console.log("\nRunning as a validator ...");
      this.validator();
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
            .from(this.contract.state!.settings.uploader)
            .tag("Application", this.APP_NAME)
            .tag("Pool", this.poolID)
            // TODO: Figure out why this errors
            .exclude("anchor")
            .findAll()) as GQLEdgeTransactionInterface[];

          console.log(`\n[listener] Found ${res.length} new transactions.`);

          for (const { node } of res) {
            console.log(
              `\n[listener] Parsing transaction.\n  txID = ${node.id}`
            );

            const data: any[] = JSON.parse(await getData(node.id));
            subscriber.next({
              id: node.id,
              data,
              transaction: node,
              block: node.block.height,
            });
          }
        }

        setTimeout(main, 10000, height);
      };

      this.arweave.network.getInfo().then((res) => main(res.height));
    });
  }

  protected uploader(dryRun: boolean = false) {
    const node = new Observable<UploadFunctionReturn>((subscriber) =>
      this.uploadFunc(subscriber, this.contract.state!.config)
    );

    node.subscribe((data) => {
      this.uploaderBuffer.push(data);
      this.bundleAndUpload();
    });
  }

  private async bundleAndUpload() {
    const bundleSize = this.contract.state!.settings.bundleSize;

    if (bundleSize === 1) {
      const buffer = this.uploaderBuffer;
      this.uploaderBuffer = [];

      const transaction = await this.arweave.createTransaction(
        {
          data: JSON.stringify(buffer[0].data),
        },
        this.keyfile
      );

      const tags = [
        { name: "Application", value: APP_NAME },
        { name: "Pool", value: this.poolID.toString() },
        ...(buffer[0].tags || []),
      ];
      for (const { name, value } of tags) {
        transaction.addTag(name, value);
      }

      await this.arweave.transactions.sign(transaction, this.keyfile);
      await this.arweave.transactions.post(transaction);

      console.log(
        `\nSent a transaction.\n  txID = ${
          transaction.id
        }\n  cost = ${this.arweave.ar.winstonToAr(transaction.reward)} AR`
      );
    } else {
      console.log(`\nBuffer size is now: ${this.uploaderBuffer.length}`);
      if (this.uploaderBuffer.length >= bundleSize) {
        const buffer = this.uploaderBuffer;
        this.uploaderBuffer = [];

        const items = [];
        for (const entry of buffer) {
          const item = await bundles.createData(
            {
              data: JSON.stringify(entry.data),
              tags: [
                { name: "Application", value: APP_NAME },
                { name: "Pool", value: this.poolID.toString() },
                ...(entry.tags || []),
              ],
            },
            this.keyfile
          );
          items.push(await bundles.sign(item, this.keyfile));
        }

        const bundle = await bundles.bundleData(items);
        const transaction = await this.arweave.createTransaction(
          { data: JSON.stringify(bundle) },
          this.keyfile
        );

        transaction.addTag("Bundle-Format", "json");
        transaction.addTag("Bundle-Version", "1.0.0");
        transaction.addTag("Content-Type", "application/json");

        await this.arweave.transactions.sign(transaction, this.keyfile);
        await this.arweave.transactions.post(transaction);

        console.log(
          `\nSent a bundle with ${items.length} items.\n  txID = ${
            transaction.id
          }\n  cost = ${this.arweave.ar.winstonToAr(transaction.reward)} AR`
        );
      }
    }
  }

  protected validator() {
    const node = new Observable<ValidateFunctionReturn>((subscriber) =>
      this.validateFunc(
        this.listener(),
        subscriber,
        this.contract.state!.config
      )
    );

    node.subscribe((res) => {
      this.validatorBuffer.push(res);
      this.bundleAndSubmit();
    });
  }

  private async bundleAndSubmit() {
    const bundleSize = this.contract.state!.settings.bundleSize;
    console.log(`\nBuffer size is now: ${this.validatorBuffer.length}`);

    if (this.validatorBuffer.length >= bundleSize) {
      const buffer = this.validatorBuffer;
      this.validatorBuffer = [];

      const transaction = await this.arweave.createTransaction(
        {
          data: JSON.stringify(
            buffer.map((item) => ({ txID: item.id, valid: item.valid }))
          ),
        },
        this.keyfile
      );

      transaction.addTag("App-Name", "SmartWeaveAction");
      transaction.addTag("App-Version", "0.3.0");
      transaction.addTag("Contract", this.poolID);
      transaction.addTag("Input", JSON.stringify({ function: "submit" }));

      await this.arweave.transactions.sign(transaction, this.keyfile);
      await this.arweave.transactions.post(transaction);

      console.log(
        `\nSent a bundle with ${buffer.length} items.\n  txID = ${
          transaction.id
        }\n  cost = ${this.arweave.ar.winstonToAr(transaction.reward)} AR`
      );
    }
  }
}

export const getData = async (id: string) => {
  const res = await arweaveClient.transactions.getData(id, {
    decode: true,
    string: true,
  });

  return res.toString();
};
