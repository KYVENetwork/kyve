import { UploadFunctionSubscriber } from "@kyve/core/dist/faces";
import { BlockResponse, Connection } from "@solana/web3.js";

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
