import {
  ArweaveSigner,
  Bundle,
  bundleAndSignData,
  createData,
  DataItem,
} from "arbundles";
import { JWKInterface } from "arbundles/build/interface-jwk";
import Arweave from "arweave";
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
export const SPACE = "nodes";
export { Pool } from "./utils/ethers";

export default class KYVE {
  // Arweave variables.
  public arweave: Arweave = client;
  protected keyfile: JWKInterface;
  protected signer: ArweaveSigner;

  // Pool variables.
  public pool: Contract;
  public stake: number;
  public settings: any;
  public config: any;

  // Node variables.
  public snapshot: Snapshot;
  public uploadFunc: UploadFunction;
  public validateFunc: ValidateFunction;
  private buffer: DataItem[] = [];

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
    this.keyfile = options.jwk;
    this.signer = new ArweaveSigner(options.jwk);

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
        "proposal/created",
        async (message: {
          id: string;
          event: "proposal/created";
          space: string;
          expire: number;
        }) => {
          if (message.space === this.SPACE) {
            const proposal = message.id.slice(9);
            const { author, body } = await Query(proposal);

            if (author === (await this.pool._uploader())) {
              const content = JSON.parse(body) as {
                transaction: string;
                bundle?: string;
                bytes: number;
                pool: string;
              };

              if (content.pool === this.pool.address) {
                let res: any;

                if (content.bundle) {
                  const bundle = new Bundle(
                    Buffer.from(
                      await this.arweave.transactions.getData(content.bundle, {
                        decode: true,
                      })
                    )
                  );

                  // TODO: const item = bundle.get(content.transaction);
                  const item = bundle.items.find(
                    (item) => item.id === content.transaction
                  )!;
                  res = JSON.parse(item.rawData.toString());
                } else {
                  res = JSON.parse(
                    (
                      await this.arweave.transactions.getData(
                        content.transaction,
                        {
                          decode: true,
                          string: true,
                        }
                      )
                    ).toString()
                  );
                }

                if (
                  content.bytes === Buffer.from(JSON.stringify(res)).byteLength
                ) {
                  subscriber.next({
                    proposal,
                    id: content.transaction,
                    data: res.data,
                    tags: res.tags,
                  });
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
    if (this.settings.bundleSize === 1) {
      // Upload input directly to Arweave.
      // Don't use bundles.
      const transaction = await this.arweave.createTransaction({
        data: JSON.stringify({
          data: input.data,
          tags: input.tags || [],
        }),
      });

      const tags = [
        { name: "Application", value: this.APP_NAME },
        { name: "Pool", value: this.pool.address },
        { name: "Content-Type", value: "application/json" },
        ...(input.tags || []),
      ];
      for (const tag of tags) {
        transaction.addTag(tag.name, tag.value);
      }

      await this.arweave.transactions.sign(transaction, this.keyfile);
      await this.arweave.transactions.post(transaction);

      const timestamp = +(Date.now() / 1e3).toFixed();
      const message = {
        space: this.SPACE,
        type: "single-choice",
        title: transaction.id,
        body: JSON.stringify({
          transaction: transaction.id,
          bytes: transaction.data_size,
          pool: this.pool.address,
        }),
        choices: ["Valid", "Invalid"],
        start: timestamp,
        end: timestamp + this.settings.gracePeriod * 60,
        snapshot: await wallet.provider.getBlockNumber(),
        network: "1287",
        strategies: JSON.stringify([
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
        ]),
        plugins: JSON.stringify({}),
        metadata: JSON.stringify({}),
      };
      await this.snapshot.proposal(wallet, await wallet.getAddress(), message);
    } else {
      // Encode the input and add it to the buffer.
      const item = createData(
        JSON.stringify({
          data: input.data,
          tags: input.tags || [],
        }),
        this.signer,
        {
          tags: [
            { name: "Application", value: this.APP_NAME },
            { name: "Pool", value: this.pool.address },
            { name: "Content-Type", value: "application/json" },
            ...(input.tags || []),
          ],
        }
      );
      await item.sign(this.signer);
      this.buffer.push(item);

      // Check the size of the buffer.
      if (this.buffer.length >= this.settings.bundleSize) {
        // Upload bundle to Arweave.
        const bundle = await bundleAndSignData(this.buffer, this.signer);
        this.buffer = [];

        const transaction = await bundle.toTransaction(
          this.arweave,
          this.keyfile
        );
        await this.arweave.transactions.sign(transaction, this.keyfile);
        await this.arweave.transactions.post(transaction);

        // Create new proposals on Snapshot.
        for (const item of bundle.items) {
          const timestamp = +(Date.now() / 1e3).toFixed();
          const message = {
            space: this.SPACE,
            type: "single-choice",
            title: item.id,
            body: JSON.stringify({
              transaction: item.id,
              bundle: transaction.id,
              bytes: item.rawData.byteLength,
              pool: this.pool.address,
            }),
            choices: ["Valid", "Invalid"],
            start: timestamp,
            end: timestamp + this.settings.gracePeriod * 60,
            snapshot: await wallet.provider.getBlockNumber(),
            network: "1287",
            strategies: JSON.stringify([
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
            ]),
            plugins: JSON.stringify({}),
            metadata: JSON.stringify({}),
          };
          await this.snapshot.proposal(
            wallet,
            await wallet.getAddress(),
            message
          );
        }
      }
    }
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

    node.subscribe((res) => this.submit(res));
  }

  private async submit(input: ValidateFunctionReturn) {
    const message = {
      space: this.SPACE,
      proposal: input.proposal,
      type: "vote",
      choice: input.valid ? 1 : 2,
      metadata: JSON.stringify({}),
    };
    await this.snapshot.vote(wallet, await wallet.getAddress(), message);
  }

  // Private Helpers
  private async syncMetadata() {
    this.settings = JSON.parse(await this.pool._settings());
    this.config = JSON.parse(await this.pool._config());
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
