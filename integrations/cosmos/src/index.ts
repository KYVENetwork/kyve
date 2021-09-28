import {
  UploadFunctionSubscriber,
  ListenFunctionObservable,
  ValidateFunctionSubscriber,
} from "@kyve/core/dist/faces";
import fetch from "node-fetch";
import hash from "object-hash";
import KYVE, { getData } from "@kyve/core";
import { JWKInterface } from "arweave/node/lib/wallet";

const upload = async (
  uploader: UploadFunctionSubscriber,
  pool: string,
  config: any
) => {
  let res = await (await fetch(`${config.endpoint}/blocks`)).json();
  if (res.data) res = res.data;
  let latestBlock = res[0].height;

  setInterval(async () => {
    let res = await (
      await fetch(`${config.endpoint}/blocks?after=${latestBlock}`)
    ).json();
    if (res.data) res = res.data;

    for (const block of res) {
      const tags = [
        { name: "Block", value: block.block_hash },
        { name: "Height", value: block.height },
      ];

      if (block.tx_data) {
        if (block.tx_data.txs) {
          const txs = [];
          for (const hash of block.tx_data.txs) {
            const tx = await (
              await fetch(`${config.endpoint}/tx?hash=${hash}`)
            ).json();

            txs.push(tx);
            tags.push({ name: "Transaction", value: tx.tx_hash });
          }
          block.tx_data.txs = txs;
        }
      } else {
        for (const tx of block.txs) {
          tags.push({ name: "Transaction", value: tx.tx_hash });
        }
      }
      latestBlock = block.height;

      uploader.next({ data: block, tags });
    }
  }, 5000);
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

    let block = (
      await (
        await fetch(`${config.endpoint}/blocks?after=${height - 1}&limit=1`)
      ).json()
    )[0];
    if (block.tx_data) {
      if (block.tx_data.txs) {
        const txs = [];
        for (const tx of block.tx_data.txs) {
          txs.push(
            await (await fetch(`${config.endpoint}/tx?hash=${tx}`)).json()
          );
        }
        block.tx_data.txs = txs;
      }
    }
    const localHash = hash(block);

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
