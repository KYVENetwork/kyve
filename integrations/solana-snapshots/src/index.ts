import KYVE from "@kyve/core";
import {
  ListenFunctionObservable,
  ListenFunctionReturn,
  UploadFunctionSubscriber,
  ValidateFunctionSubscriber,
} from "@kyve/core/dist/faces";
import { BlockResponse, Connection } from "@solana/web3.js";
import { JWKInterface } from "arweave/node/lib/wallet";
import hash from "object-hash";

const upload = async (
  uploader: UploadFunctionSubscriber,
  config: { endpoint: string; size: number }
) => {
  // Connect to the Solana RPC endpoint.
  // Commitment is set to "finalized".
  const connection = new Connection(config.endpoint, {
    commitment: "finalized",
  });

  // TODO: Fetch the slot height of the last snapshot.
  let height = 0;

  const main = async () => {
    // Fetch the latest slot height from the endpoint.
    const currentHeight = await connection.getSlot();

    // Group the difference in slot heights into snapshot ranges.
    const ranges: { min: number; max: number }[] = [];
    let i = height;
    while (i < currentHeight) {
      if (i + config.size <= currentHeight) {
        ranges.push({ min: i, max: i + config.size });
      }
      i += config.size;
    }

    // Iterate over the ranges and pull down block data.
    for (const range of ranges) {
      const data: BlockResponse[] = [];

      for (let i = range.min; i <= range.max; i++) {
        const res = await connection.getBlock(i);
        if (res) data.push(res);
      }

      uploader.next({
        data,
        tags: [
          { name: "Minimum-Height", value: range.min.toString() },
          { name: "Maximum-Height", value: range.max.toString() },
        ],
      });
    }

    // Wait 10 minutes, then run again.
    setTimeout(main, 1000 * 60 * 10);
  };

  main();
};

const validate = async (
  listener: ListenFunctionObservable,
  validator: ValidateFunctionSubscriber,
  config: { endpoint: string; size: number }
) => {
  // Connect to the Solana RPC endpoint.
  // Commitment is set to "finalized".
  const connection = new Connection(config.endpoint, {
    commitment: "finalized",
  });

  // Subscribe to the listener.
  listener.subscribe(async (res: ListenFunctionReturn) => {
    // Fetch the slot range of the snapshot.
    const min = parseInt(
      res.transaction.tags.find((tag) => tag.name === "Minimum-Height")?.value!
    );
    const max = parseInt(
      res.transaction.tags.find((tag) => tag.name === "Maximum-Height")?.value!
    );

    // Iterate over the slot range, and pull down block data.
    const data: BlockResponse[] = [];

    for (let i = min; i <= max; i++) {
      const res = await connection.getBlock(i);
      if (res) data.push(res);
    }

    // Hash both the local data and uploaded data.
    // Compare.
    const localHash = hash(data);
    const uploaderHash = hash(JSON.parse(res.data));

    validator.next({ valid: localHash === uploaderHash, id: res.id });
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
