import { getBlockNumber } from "@snapshot-labs/snapshot.js/dist/utils/web3";
import { ArweaveSigner, createData } from "arbundles";
import ArDB from "ardb";
import ArdbTransaction from "ardb/lib/models/transaction";
import Arweave from "arweave";
import base64url from "base64url";
import { Contract, ContractTransaction } from "ethers";
import { Observable } from "rxjs";
import {
  ListenFunctionReturn,
  Options,
  UploadFunction,
  UploadFunctionReturn,
  ValidateFunction,
  ValidateFunctionReturn,
} from "./faces";
import { client } from "./utils/arweave";
import { Pool, wallet } from "./utils/ethers";
import Log from "./utils/logger";
import Snapshot, { Query, ws } from "./utils/snapshot";

export const APP_NAME = "KYVE - DEV";
export const SPACE = "nodes.kyve.eth";

export default class KYVE {
  // Arweave variables.
  public arweave: Arweave = client;
  protected signer: ArweaveSigner;
  public ardb: ArDB;

  // Pool variables.
  public pool: Contract;
  public stake: number;
  public settings: any;
  public config: any;

  // Node variables.
  public snapshot: Snapshot;
  public uploadFunc: UploadFunction;
  public validateFunc: ValidateFunction;

  // Constants.
  public APP_NAME = APP_NAME;
  public SPACE = SPACE;

  constructor(
    options: Options,
    uploadFunc: UploadFunction,
    validateFunc: ValidateFunction
  ) {
    if (options.arweave) {
      this.arweave = options.arweave;
    }
    this.signer = new ArweaveSigner(options.jwk);
    this.ardb = new ArDB(this.arweave);

    this.pool = Pool(options.pool);
    this.stake = options.stake;

    this.snapshot = new Snapshot();
    this.uploadFunc = uploadFunc;
    this.validateFunc = validateFunc;
  }

  public async run() {
    const log = new Log("core");

    const address = await wallet.getAddress();
    await this.syncMetadata();

    const currentStake = await this.pool._stakingAmounts(address);
    const diff = Math.abs(this.stake - currentStake);

    if (this.stake === currentStake) {
      log.info(
        `Already staked with ${this.stake} $KYVE in pool ${this.pool.address}.`
      );
    } else if (this.stake > currentStake) {
      const transaction = (await this.pool.stake(diff)) as ContractTransaction;
      log.info(
        `Staking ${diff} $KYVE in pool ${this.pool.address}. Transaction: ${transaction.hash}.`
      );

      await transaction.wait();
      log.info("Successfully staked tokens.");
    } else {
      // TODO: Unstake tokens.
    }

    if (address === (await this.pool._uploader())) {
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
      ws.on(
        "data",
        async (message: {
          id: string;
          event: "proposal/created";
          space: string;
          expire: number;
        }) => {
          if (
            message.space === this.SPACE &&
            message.event === "proposal/created"
          ) {
            const proposal = message.id.slice(9);
            const body = await Query(proposal);
            const content = JSON.parse(body) as {
              transaction: string;
              bytes: number;
            };

            const res = (await this.ardb
              .search()
              .id(content.transaction)
              .findAll()) as ArdbTransaction[];

            if (res.length) {
              const transaction = res[0];

              if (transaction.data.size === content.bytes) {
                try {
                  const data = await getData(content.transaction);

                  subscriber.next({
                    proposal,
                    id: content.transaction,
                    data,
                    transaction,
                    block: transaction.block.height,
                  });
                } catch (e) {
                  log.warn(
                    `Error while fetching data for transaction: ${content.transaction}`
                  );
                }
              }
            }
          }
        }
      );
    });
  }

  protected uploader() {
    const node = new Observable<UploadFunctionReturn>((subscriber) =>
      this.uploadFunc(subscriber, this.pool.address, this.config)
    );

    node.subscribe((data) => this.register(data));
  }

  private async register(input: UploadFunctionReturn) {
    // Upload data to Arweave.
    const item = createData(JSON.stringify(input.data), this.signer, {
      tags: input.tags,
    });
    await item.sign(this.signer);
    await item.sendToBundler();

    // Submit a new proposal on Snapshot.
    const timestamp = +(Date.now() / 1e3).toFixed();
    const payload = {
      name: item.id,
      body: JSON.stringify({
        transaction: item.id,
        bytes: item.data.length,
      }),
      choices: ["Valid", "Invalid"],
      start: timestamp,
      end: timestamp + this.settings.gracePeriod,
      snapshot: await getBlockNumber(wallet.provider),
      type: "single-choice",
      metadata: {
        plugins: {},
        network: 1287,
        strategies: [
          {
            name: "contract-call",
            params: {
              address: this.pool.address,
              decimals: 0,
              symbol: "vote(s)",
              methodABI: {
                inputs: [
                  {
                    internalType: "address",
                    name: "node",
                    type: "address",
                  },
                ],
                name: "isValidator",
                outputs: [
                  {
                    internalType: "uint256",
                    name: "",
                    type: "uint256",
                  },
                ],
                stateMutability: "view",
                type: "function",
              },
            },
          },
        ],
      },
    };
    await this.snapshot.proposal(wallet, this.SPACE, payload);
  }

  protected validator() {
    const node = new Observable<ValidateFunctionReturn>((subscriber) =>
      this.validateFunc(
        this.listener(),
        subscriber,
        this.pool.address,
        this.config
      )
    );

    node.subscribe((res) => {
      const payload = {
        proposal: res.proposal,
        choice: res.valid ? 1 : 0,
      };
      this.snapshot.vote(wallet, this.SPACE, payload);
    });
  }

  // Private Helpers
  private async syncMetadata(input?: string) {
    const rawId = input || ((await this.pool._metadata()) as string);
    const id = base64url.encode(rawId.slice(2), "hex");

    const data = JSON.parse(await getData(id));
    this.settings = data.settings;
    this.config = data.config;
  }
}

export const getData = async (
  id: string,
  arweave: Arweave = client
): Promise<string> => {
  const res = await arweave.transactions.getData(id, {
    decode: true,
    string: true,
  });

  return res.toString();
};
