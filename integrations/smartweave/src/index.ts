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
import { SmartWeaveNodeFactory } from "redstone-smartweave";
import WebSocket from "ws";

const inst = new Arweave({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

const swcClient = SmartWeaveNodeFactory.memCached(inst);

const logger = new Log("SmartWeave");

export const upload = async (
  uploader: UploadFunctionSubscriber,
  pool: string,
  config: { contracts: string[] }
) => {
  const storage: { [id: string]: string } = {};

  const client = new WebSocket("wss://arweave.ws/blocks");

  client.on("message", async (msg) => {
    const height = parseInt(msg.toString());

    for (const id of config.contracts) {
      const res = await swcClient.contract(id).readState(height);
      const resHash = hash(res);

      if (storage[id] === resHash) continue;

      logger.info("Contract changed, uploading new result...");
      uploader.next({
        data: res,
        tags: [
          { name: "Target-Contract", value: id },
          { name: "Block", value: height.toString() },
        ],
      });

      storage[id] = hash(res);
    }
  });

  client.on("ping", client.pong);
};

export const validate = async (
  listener: ListenFunctionObservable,
  validator: ValidateFunctionSubscriber,
  pool: string,
  config: { contracts: string[] }
) => {
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
    const state = await swcClient.contract(contract).readState(block);

    const localHash = hash(JSON.parse(JSON.stringify(state)));
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
      arweave: inst,
    },
    upload,
    validate
  );

  return instance;
}
