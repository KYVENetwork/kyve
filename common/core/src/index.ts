import Arweave from "arweave";
import ArDB from "ardb";
import {
  ListenFunctionReturn,
  Options,
  UploadFunction,
  UploadFunctionReturn,
  ValidateFunction,
  ValidateFunctionReturn,
} from "./faces";
import { JWKInterface } from "arweave/node/lib/wallet";
import hash from "object-hash";
import { Observable } from "rxjs";
import { arweaveBundles as bundles, arweaveClient } from "./extensions";

import { Pool, Governance } from "@kyve/contract-lib";
import { GQLEdgeTransactionInterface } from "ardb/lib/faces/gql";
import { deposit, untilMined } from "./helper";

import Log from "./logger";
import { create } from "arweave-bundles";

export const APP_NAME = "KYVE - DEV";

export default class KYVE {
  public arweave: Arweave = arweaveClient;
  public ardb: ArDB;

  public pool: Pool;
  public governance: Governance;

  public APP_NAME: string = APP_NAME;

  public uploadFunc: UploadFunction;
  public validateFunc: ValidateFunction;
  private uploaderBuffer: UploadFunctionReturn[] = [];
  private validatorBuffer: ValidateFunctionReturn[] = [];

  private submittedTxs: string[] = [];

  private readonly refetchInterval: number = 5 * 60 * 1000;

  public poolID: string;
  public stake: number;

  protected keyfile: JWKInterface;

  protected dryRun: boolean = false;

  constructor(
    options: Options,
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
    if (options.refetchInterval) {
      this.refetchInterval = options.refetchInterval;
    }

    this.ardb = new ArDB(this.arweave);
    this.pool = new Pool(this.arweave, this.keyfile, options.pool);
    this.governance = new Governance(this.arweave, this.keyfile);
  }

  public async run() {
    const log = new Log("core");
    const state = await this.pool.getState();

    // shut down if no uploader is selected
    if (!state.settings.uploader) {
      log.error(
        "No uploader specified in pool. Please create a vote to elect an uploader."
      );
    }

    const address = await this.arweave.wallets.getAddress(this.keyfile);

    // check if node has deposited tokens
    if (!Object.keys(state.credit).includes(address)) {
      await deposit(
        this.stake,
        address,
        this.governance,
        this.pool,
        this.arweave
      );
    }

    const currentStake = state.credit[address].stake;
    const diff = Math.abs(this.stake - currentStake);

    if (this.stake === currentStake) {
      log.info(
        `Already staked with ${this.stake} $KYVE in pool ${this.pool.id}.`
      );
    } else if (this.stake > currentStake) {
      // if node has not enough tokens to stake, deposit missing ones
      if (state.credit[address].amount < diff) {
        await deposit(diff, address, this.governance, this.pool, this.arweave);
      }

      // stake missing tokens
      const id = await this.pool.stake(diff);
      log.info(
        `Staking ${diff} $KYVE in pool ${this.pool.id}. Transaction: ${id}`
      );
      await untilMined(id, this.arweave);
      log.info("Successfully staked tokens");
    } else {
      const id = await this.pool.unstake(diff);
      log.info(
        `Unstaking ${diff} $KYVE in pool ${this.pool.id}. Transaction: ${id}`
      );
      await untilMined(id, this.arweave);
      log.info("Successfully unstaked tokens");
    }

    if (address === state.settings.uploader) {
      log.info("Running as an uploader ...");
      this.uploader();
    } else {
      log.info("Running as a validator ...");
      this.validator();
    }
  }

  private listener() {
    const log = new Log("listener");

    return new Observable<ListenFunctionReturn>((subscriber) => {
      let latestHash = "";

      const main = async (address: string) => {
        const state = await this.pool.getState();
        const newHash = hash(state);

        if (newHash === latestHash) {
          // State hasn't changed.
          // Do nothing.
        } else {
          // State has changed.
          // Find all pending transactions that need votes.

          const unhandledTxs = await this.pool.getUnhandledTxs(address);

          for (const id of unhandledTxs) {
            // Skip if transaction got already submitted but
            // has not been mined yet
            if (this.submittedTxs.indexOf(id) > -1) continue;

            const res = (await this.ardb
              .search()
              .id(id)
              .findAll()) as GQLEdgeTransactionInterface[];

            if (!res.length) continue;
            const node = res[0].node;

            try {
              const data = await getData(id);

              subscriber.next({
                id,
                data,
                transaction: node,
                block: node.block.height,
              });
              this.submittedTxs.push(id);
            } catch (e) {
              log.warn(`Error while fetching data for transaction: ${id}`);
            }
          }
        }

        // refetch every x ms
        setTimeout(main, this.refetchInterval, address);
      };

      this.arweave.wallets.getAddress(this.keyfile).then((res) => main(res));
    });
  }

  protected uploader(dryRun: boolean = false) {
    const node = new Observable<UploadFunctionReturn>((subscriber) =>
      this.uploadFunc(subscriber, this.poolID, this.pool.state!.config)
    );

    node.subscribe((data) => {
      this.uploaderBuffer.push(data);
      this.bundleAndUpload();
    });
  }

  private async bundleAndUpload() {
    const log = new Log("uploader");
    const bundleSize = this.pool.state!.settings.bundleSize;

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
        { name: "Pool", value: this.pool.id! },
        { name: "App-Name", value: "SmartWeaveAction" },
        { name: "App-Version", value: "0.3.0" },
        { name: "Contract", value: this.pool.id! },
        { name: "Input", value: JSON.stringify({ function: "register" }) },
        ...(buffer[0].tags || []),
      ];
      for (const { name, value } of tags) {
        transaction.addTag(name, value);
      }

      transaction.reward = (parseInt(transaction.reward) * 2).toString();

      await this.arweave.transactions.sign(transaction, this.keyfile);
      await this.arweave.transactions.post(transaction);

      log.info(
        `Sent a transaction: ${
          transaction.id
        }. Cost: ${this.arweave.ar.winstonToAr(transaction.reward)} AR`
      );
    } else {
      log.info(`Buffer size is now: ${this.uploaderBuffer.length}`);
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
        transaction.addTag("App-Name", "SmartWeaveAction");
        transaction.addTag("App-Version", "0.3.0");
        transaction.addTag("Contract", this.pool.id!);
        transaction.addTag("Input", JSON.stringify({ function: "register" }));

        transaction.reward = (parseInt(transaction.reward) * 2).toString();

        await this.arweave.transactions.sign(transaction, this.keyfile);
        await this.arweave.transactions.post(transaction);

        log.info(
          `Sent a bundle with ${items.length} items: ${
            transaction.id
          }. Cost: ${this.arweave.ar.winstonToAr(transaction.reward)} AR`
        );
      }
    }
  }

  protected validator() {
    const node = new Observable<ValidateFunctionReturn>((subscriber) =>
      this.validateFunc(
        this.listener(),
        subscriber,
        this.poolID,
        this.pool.state!.config
      )
    );

    node.subscribe((res) => {
      this.validatorBuffer.push(res);
      this.bundleAndSubmit();
    });
  }

  private async bundleAndSubmit() {
    const log = new Log("validator");
    const bundleSize = this.pool.state!.settings.bundleSize;
    log.info(`Buffer size is now: ${this.validatorBuffer.length}`);

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
      transaction.addTag("Contract", this.pool.id!);
      transaction.addTag("Input", JSON.stringify({ function: "submit" }));
      transaction.addTag("Contract", this.governance.id);
      transaction.addTag(
        "Input",
        JSON.stringify({ function: "readOutbox", contract: this.pool.id! })
      );

      transaction.reward = (parseInt(transaction.reward) * 2).toString();

      await this.arweave.transactions.sign(transaction, this.keyfile);
      await this.arweave.transactions.post(transaction);

      log.info(
        `Sent a bundle with ${buffer.length} items: ${
          transaction.id
        }. Cost: ${this.arweave.ar.winstonToAr(transaction.reward)} AR`
      );
    }
  }
}

export const getData = async (
  id: string,
  arweave: Arweave = arweaveClient
): Promise<string> => {
  const res = await arweave.transactions.getData(id, {
    decode: true,
    string: true,
  });

  return res.toString();
};
