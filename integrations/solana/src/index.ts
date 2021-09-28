import {
  UploadFunctionSubscriber,
  ListenFunctionObservable,
  ValidateFunctionSubscriber,
} from "@kyve/core/dist/faces";
import { fetchLatestSlot, fetchSlot, fetchSlots } from "./utils";
import hash from "object-hash";
import KYVE, { getData } from "@kyve/core";
import { JWKInterface } from "arweave/node/lib/wallet";

const upload = async (
  uploader: UploadFunctionSubscriber,
  pool: string,
  config: any
) => {
  const main = async (latestSlot: number) => {
    const newLatest = await fetchLatestSlot(config.endpoint);

    if (latestSlot !== newLatest) {
      // TODO: Ask about fetching the same slots ...
      for (const num of await fetchSlots(
        latestSlot + 1,
        newLatest,
        config.endpoint
      )) {
        const slot = await fetchSlot(num, config.endpoint);
        const tags = [
          { name: "Block", value: slot.blockhash },
          { name: "Height", value: num },
        ];

        uploader.next({ data: slot, tags });

        latestSlot = num;
      }
    }

    setTimeout(main, 5000, latestSlot);
  };

  main(await fetchLatestSlot(config.endpoint));
};

const validate = async (
  listener: ListenFunctionObservable,
  validator: ValidateFunctionSubscriber,
  pool: string,
  config: any
) => {
  listener.subscribe(async (res) => {
    const height = parseFloat(
      res.transaction.tags.find((tag) => tag.name === "Height")?.value!
    );

    const slot = await fetchSlot(height, config.endpoint);
    const localHash = hash(slot);

    const data = await getData(res.id);
    const compareHash = hash(JSON.parse(data.toString()));

    validator.next({
      proposal: res.proposal,
      valid: localHash === compareHash,
    });
  });
};

export default function main(pool: string, stake: number, jwk: JWKInterface) {
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
