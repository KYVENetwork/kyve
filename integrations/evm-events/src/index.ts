import KYVE, { getData } from "@kyve/core";
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
import { EventData } from "web3-eth-contract";

const logger = new Log("EVM Events");

export const upload = async (
  uploader: UploadFunctionSubscriber,
  pool: string,
  config: { abi: string; address: string; endpoint: string }
) => {
  // Connect to the WebSocket endpoint.
  const client = new Web3(
    new Web3.providers.WebsocketProvider(config.endpoint)
  );
  logger.info(`Connection created. endpoint = ${config.endpoint}`);

  // Create a contract class by using the ABI code.
  const contract = new client.eth.Contract(
    JSON.parse(await getData(config.abi)),
    config.address
  );

  // Subscribe to new events.
  contract.events.allEvents().on("data", async (res: EventData) => {
    logger.info(`Recieved event. type = ${res.event}`);

    uploader.next({
      data: res,
      tags: [
        { name: "Contract", value: res.address },
        { name: "Event", value: res.event },
        { name: "Transaction", value: res.transactionHash },
        { name: "Block", value: res.blockNumber.toString() },
        { name: "BlockHash", value: res.blockHash },
        ...Object.entries(res.returnValues).map(([key, value]) => ({
          name: key,
          value,
        })),
      ],
    });
  });
};

export const validate = async (
  listener: ListenFunctionObservable,
  validator: ValidateFunctionSubscriber,
  pool: string,
  config: { abi: string; address: string; endpoint: string }
) => {
  // Connect to the WebSocket endpoint.
  const client = new Web3(
    new Web3.providers.WebsocketProvider(config.endpoint)
  );
  logger.info(`Connection created. endpoint = ${config.endpoint}`);

  // Create a contract class by using the ABI code.
  const contract = new client.eth.Contract(
    JSON.parse(await getData(config.abi)),
    config.address
  );

  // Subscribe to the listener.
  listener.subscribe(async (res: ListenFunctionReturn) => {
    const event = res.data.event;
    const transaction = res.data.transactionHash;
    const block = res.data.blockNumber;

    logger.info(`Found event. type = ${event}`);

    const events = await contract.getPastEvents(event, {
      fromBlock: block,
      toBlock: block,
    });
    const data = events.find((event) => event.transactionHash === transaction)!;

    const localHash = hash(data);
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
