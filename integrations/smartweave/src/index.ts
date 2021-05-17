import {
  UploadFunctionSubscriber,
  ListenFunctionObservable,
  ValidateFunctionSubscriber,
} from "@kyve/core/dist/faces";
import Arweave from "arweave";
import { readContract } from "smartweave";
import hash from "object-hash";
import KYVE, { getData } from "@kyve/core";
import { JWKInterface } from "arweave/node/lib/wallet";

const client = new Arweave({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

export const upload = async (
  uploader: UploadFunctionSubscriber,
  config: any
) => {
  // mapping contract address to state
  let states: { [id: string]: any } = {};

  const main = async (latest: number) => {
    const height = (await client.network.getInfo()).height;
    console.log("Height:", height, "Latest:", latest);

    if (latest !== height) {
      for (const id of config.contracts) {
        const res = await readContract(client, id, latest, true);
        const state = res.state

        if (states[id]) {
          const previousHash = hash(states[id]);
          const latestHash = hash(state);

          if (previousHash === latestHash) {
            // no change, can continue
            continue;
          } else {
            console.log("Contract updated, uploading new state...")
          }
        }

        console.log("Uploading...")
        uploader.next({
          data: state,
          tags: [
            { name: "Contract", value: id },
            { name: "Block", value: latest },
          ],
        });

        states[id] = state;
      }
    }

    //refetch every 10 minutes
    setTimeout(main, 10 * 60 * 1000, height);
  };

  // start with latest block of 0
  main(0);
};

export const validate = async (
  listener: ListenFunctionObservable,
  validator: ValidateFunctionSubscriber,
  config: any
) => {
  listener.subscribe(async (res) => {
    const contract = res.transaction.tags.find((tag) => tag.name === "Contract")
      ?.value!;
    const block = parseFloat(
      res.transaction.tags.find((tag) => tag.name === "Block")?.value!
    );

    const state = await readContract(client, contract, block, true);
    const localHash = hash(state);

    const data = await getData(res.id);
    const compareHash = hash(JSON.parse(data.toString()));

    validator.next({ valid: localHash === compareHash, id: res.id });
  });
};

export default function main(pool: number, stake: number, jwk: JWKInterface) {
  const instance = new KYVE(
    {
      pool,
      stake,
      jwk,
    },
    upload,
    validate
  );

  return instance;
}
