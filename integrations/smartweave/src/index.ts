import {
  ListenFunctionObservable,
  ListenFunctionReturn,
  UploadFunctionSubscriber,
  ValidateFunctionSubscriber,
} from "@kyve/core/dist/faces";
import Arweave from "arweave";
import { readContract } from "smartweave";
import hash from "object-hash";
import KYVE, { getData } from "@kyve/core";
import { JWKInterface } from "arweave/node/lib/wallet";
import { GQLTagInterface } from "smartweave/lib/interfaces/gqlResult";

const client = new Arweave({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

export const upload = async (
  uploader: UploadFunctionSubscriber,
  config: any
) => {
  // mapping contract address to hash(state)
  let contracts: { [id: string]: string } = {};

  const main = async (previousHeight: number) => {
    const currentHeight = (await client.network.getInfo()).height;
    console.log(
      "Current-Height:",
      currentHeight,
      "Previous-Height:",
      previousHeight
    );

    if (previousHeight !== currentHeight) {
      for (const id of config.contracts) {
        const res = await readContract(client, id, currentHeight, true);

        if (contracts[id]) {
          const previousHash = contracts[id];
          const currentHash = hash(res);

          if (previousHash === currentHash) {
            // no change, can continue
            continue;
          }
        }

        console.log("Contract changed, uploading new result...");
        uploader.next({
          data: res,
          tags: [
            { name: "Target-Contract", value: id },
            { name: "Block", value: currentHeight },
          ],
        });

        contracts[id] = hash(res);
      }
    }

    //refetch every 10 minutes
    setTimeout(main, 10 * 60 * 1000, currentHeight);
  };

  const height = (await client.network.getInfo()).height;
  // start with latest block height
  main(height);
};

export const validate = async (
  listener: ListenFunctionObservable,
  validator: ValidateFunctionSubscriber,
  config: any
) => {
  listener.subscribe(async (res: ListenFunctionReturn) => {
    const contract = res.transaction.tags.find(
      (tag: GQLTagInterface) => tag.name === "Target-Contract"
    )?.value!;

    const block = parseInt(
      res.transaction.tags.find((tag: GQLTagInterface) => tag.name === "Block")
        ?.value!
    );

    if (!(contract && block)) {
      console.warn("Error while parsing tags. Skipping...");
      return;
    }

    const state = await readContract(client, contract, block, true);
    const localHash = hash(state);

    const compareHash = hash(JSON.parse(res.data));

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
