import {
  ListenFunctionObservable,
  ListenFunctionReturn,
  UploadFunctionSubscriber,
  ValidateFunctionSubscriber,
} from "@kyve/core/dist/faces";
import Arweave from "arweave";
import hash from "object-hash";
import KYVE from "@kyve/core";
import Log from "@kyve/core/dist/logger";
import { JWKInterface } from "arweave/node/lib/wallet";
import { GQLTagInterface } from "smartweave/lib/interfaces/gqlResult";
import { connect, start } from "./db";
import { readContract } from "./utils";

const client = new Arweave({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

const logger = new Log("SmartWeave");

export const upload = async (
  uploader: UploadFunctionSubscriber,
  pool: string,
  config: any
) => {
  // Connect to the local database.
  const connection = connect();
  await start(connection);

  // mapping contract address to hash(state)
  let contracts: { [id: string]: string } = {};

  const main = async (previousHeight: number) => {
    const currentHeight = (await client.network.getInfo()).height;
    logger.info(
      `Current-Height: ${currentHeight} - Previous-Height: ${previousHeight}`
    );

    if (previousHeight !== currentHeight) {
      for (const id of config.contracts) {
        const res = await readContract(client, connection, id, currentHeight);

        // if no hash in local storage, upload a new state
        if (contracts[id]) {
          const previousHash = contracts[id];
          const currentHash = hash(res);

          if (previousHash === currentHash) {
            // no change, can continue
            continue;
          }
        }

        logger.info("Contract changed, uploading new result...");
        uploader.next({
          data: res,
          tags: [
            { name: "Target-Contract", value: id },
            { name: "Block", value: currentHeight },
          ],
        });

        // store hash for local comparison
        contracts[id] = hash(res);
      }
    }

    //refetch every 10 minutes
    setTimeout(main, 10 * 60 * 1000, currentHeight);
  };

  // start with latest block height
  const height = (await client.network.getInfo()).height;
  main(height);
};

export const validate = async (
  listener: ListenFunctionObservable,
  validator: ValidateFunctionSubscriber,
  pool: string,
  config: any
) => {
  // Connect to the local database.
  const connection = connect();
  await start(connection);

  listener.subscribe(async (res: ListenFunctionReturn) => {
    // find Target-Contract and Block in transaction tags
    const contract = res.transaction.tags.find(
      (tag: GQLTagInterface) => tag.name === "Target-Contract"
    )?.value!;

    const block = parseInt(
      res.transaction.tags.find((tag: GQLTagInterface) => tag.name === "Block")
        ?.value!
    );

    if (!(contract && block)) {
      logger.warn(`Error while parsing tags on ${res.id}. Skipping...`);
      return;
    }

    // read the contract to the height passed by the uploader
    const state = await readContract(client, connection, contract, block);
    const localHash = hash(state);
    const compareHash = hash(JSON.parse(res.data));

    // state is valid, if the two hashes are equal
    validator.next({ valid: localHash === compareHash, id: res.id });
  });
};

export default function main(pool: string, stake: number, jwk: JWKInterface) {
  const instance = new KYVE(
    {
      pool,
      stake,
      jwk,
      arweave: client,
    },
    upload,
    validate
  );

  return instance;
}
