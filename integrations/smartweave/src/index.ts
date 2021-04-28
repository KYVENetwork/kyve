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

const upload = async (uploader: UploadFunctionSubscriber, config: any) => {
  let state: { [id: string]: any } = {};

  const main = async (latest: number) => {
    const height = (await client.network.getInfo()).height;

    if (latest !== height) {
      for (const id of config.contracts) {
        const res = await readContract(client, id, latest, true);

        if (state.id) {
          const currentHash = hash(state.id);
          const latestHash = hash(res);

          if (currentHash === latestHash) {
            continue;
          }
        }

        uploader.next({
          data: res,
          tags: [
            { name: "Contract", value: id },
            { name: "Block", value: latest },
          ],
        });
        state.id = res;
      }
    }

    setTimeout(main, 600000, height);
  };

  main((await client.network.getInfo()).height);
};

const validate = async (
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
