import {
  UploadFunctionSubscriber,
  ListenFunctionObservable,
  ValidateFunctionSubscriber,
  ListenFunctionReturn,
} from "@kyve/core/dist/faces";
import Web3 from "web3";
import hash from "object-hash";
import KYVE from "@kyve/core";
import { JWKInterface } from "arweave/node/lib/wallet";

const upload = async (uploader: UploadFunctionSubscriber, config: any) => {
  const client = new Web3(
    new Web3.providers.WebsocketProvider(config.endpoint)
  );

  const contract = new client.eth.Contract(
    // TODO: Change this, we don't want to store it in the pool.
    config.abi,
    config.address
  );

  contract.events.allEvents.on("data", async (res: any) => {
    uploader.next({
      data: res,
      tags: [
        { name: "Contract", value: res.address },
        { name: "Event", value: res.event },
        { name: "Transaction", value: res.transactionHash },
        { name: "Block", value: res.blockNumber },
        { name: "BlockHash", value: res.blockHash },
      ],
    });
  });
};

const validate = async (
  listener: ListenFunctionObservable,
  validator: ValidateFunctionSubscriber,
  config: any
) => {
  const client = new Web3(
    new Web3.providers.WebsocketProvider(config.endpoint)
  );

  const contract = new client.eth.Contract(
    // TODO: Change this, we don't want to store it in the pool.
    config.abi,
    config.address
  );

  listener.subscribe(async (res: ListenFunctionReturn) => {
    const event = res.data.event;
    const transaction = res.data.transactionHash;
    const block = res.data.blockNumber;

    const events = await contract.getPastEvents(event, {
      fromBlock: block,
      toBlock: block,
    });
    const data = events.find((event) => event.transactionHash === transaction);

    const localHash = hash(block);
    const compareHash = hash(res.data);

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
