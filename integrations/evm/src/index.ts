import KYVE from "@kyve/core";
import {
  ListenFunctionObservable,
  ListenFunctionReturn,
  UploadFunctionSubscriber,
  ValidateFunctionSubscriber,
} from "@kyve/core/dist/faces";
import Log from "@kyve/core/dist/utils/logger";
import { JWKInterface } from "arweave/node/lib/wallet";
import hash from "object-hash";
import Web3 from "web3";

const logger = new Log("EVM");

const upload = async (
  uploader: UploadFunctionSubscriber,
  pool: string,
  config: { endpoint: string }
) => {
  // Connect to the WebSocket endpoint.
  const client = new Web3(
    new Web3.providers.WebsocketProvider(config.endpoint)
  );
  logger.info(`Connection created. endpoint = ${config.endpoint}`);

  // Subscribe to new blocks.
  client.eth.subscribe("newBlockHeaders").on("data", async (blockHeader) => {
    logger.info(`Recieved block, pulling data. height = ${blockHeader.number}`);

    const tags = [
      { name: "Block", value: blockHeader.hash },
      { name: "Height", value: blockHeader.number.toString() },
    ];

    let block = await client.eth.getBlock(blockHeader.hash, true);

    block.transactions.map((transaction) =>
      tags.push({ name: "Transaction", value: transaction.hash })
    );

    uploader.next({ data: block, tags });
  });
};

const validate = async (
  listener: ListenFunctionObservable,
  validator: ValidateFunctionSubscriber,
  pool: string,
  config: { endpoint: string }
) => {
  // Connect to the WebSocket endpoint.
  const client = new Web3(
    new Web3.providers.WebsocketProvider(config.endpoint)
  );
  logger.info(`Connection created. endpoint = ${config.endpoint}`);

  // Subscribe to the listener.
  listener.subscribe(async (res: ListenFunctionReturn) => {
    const blockHash = res.transaction.tags.find((tag) => tag.name === "Block")
      ?.value!;

    logger.info(`Found block. hash = ${blockHash}`);

    const block = await client.eth.getBlock(blockHash, true);
    const localHash = hash(JSON.stringify(block));
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
