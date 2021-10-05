import KYVE from "@kyve/core";
import {
  ListenFunctionObservable,
  ListenFunctionReturn,
  UploadFunctionSubscriber,
  ValidateFunctionSubscriber,
} from "@kyve/core/dist/faces";
import Log from "@kyve/core/dist/utils/logger";
import { JWKInterface } from "arweave/node/lib/wallet";
import { ethers } from "ethers";
import hash from "object-hash";

const logger = new Log("EVM");

const upload = async (
  uploader: UploadFunctionSubscriber,
  pool: string,
  config: { rpc: string; wss: string }
) => {
  // Connect to the WebSocket endpoint.
  const client = new ethers.providers.WebSocketProvider(config.wss);
  logger.info(`Connection created. endpoint = ${config.wss}`);

  // Subscribe to new blocks.
  client.on("block", async (height: number) => {
    logger.info(`Recieved block, pulling data. height = ${height}`);

    const block = await client.getBlockWithTransactions(height);
    if (block.transactions.length) {
      block.transactions.forEach(
        // @ts-ignore
        (transaction) => delete transaction.confirmations
      );
    }

    const tags = [
      { name: "Block", value: block.hash },
      { name: "Height", value: block.number.toString() },
    ];
    if (block.transactions.length) {
      block.transactions.forEach((transaction) =>
        tags.push({
          name: "Transaction",
          value: transaction.hash,
        })
      );
    }

    uploader.next({ data: block, tags });
  });
};

const validate = async (
  listener: ListenFunctionObservable,
  validator: ValidateFunctionSubscriber,
  pool: string,
  config: { rpc: string; wss: string }
) => {
  // Connect to the RPC endpoint.
  const client = new ethers.providers.StaticJsonRpcProvider(config.rpc);
  logger.info(`Connection created. endpoint = ${config.rpc}`);

  // Subscribe to the listener.
  listener.subscribe(async (res: ListenFunctionReturn) => {
    const blockHash = res.tags.find((tag) => tag.name === "Block")?.value!;
    logger.info(`Found block. hash = ${blockHash}`);

    const block = await client.getBlockWithTransactions(blockHash);
    if (block.transactions.length) {
      block.transactions.forEach(
        // @ts-ignore
        (transaction) => delete transaction.confirmations
      );
    }

    const localHash = hash(JSON.parse(JSON.stringify(block)));
    const uploaderHash = hash(res.data);

    validator.next({
      proposal: res.proposal,
      valid: localHash === uploaderHash,
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
