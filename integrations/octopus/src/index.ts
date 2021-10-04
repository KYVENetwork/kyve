import {
  UploadFunctionSubscriber,
  ListenFunctionObservable,
  ValidateFunctionSubscriber,
} from "@kyve/core/dist/faces";
import { WsProvider, ApiPromise } from "@polkadot/api";
import { Header } from "@polkadot/types/interfaces";
import { parseBlockByNumber } from "./parser";
import hash from "object-hash";
import KYVE, { getData } from "@kyve/core";
import { JWKInterface } from "arweave/node/lib/wallet";
import {
  RequestManager,
  WebSocketTransport,
  Client,
} from "@open-rpc/client-js";

export const upload = async (
  uploader: UploadFunctionSubscriber,
  pool: string,
  config: { endpoint: string }
) => {
  const provider = new WsProvider(config.endpoint);
  const api = await ApiPromise.create({ provider });
  const transport = new WebSocketTransport(config.endpoint);
  const client = new Client(new RequestManager([transport]));

  api.rpc.chain.subscribeFinalizedHeads(async (header: Header) => {
    const { block, tags } = await parseBlockByNumber(
      header.number.toNumber(),
      api,
      client
    );

    uploader.next({ data: block, tags });
  });
};

export const validate = async (
  listener: ListenFunctionObservable,
  validator: ValidateFunctionSubscriber,
  pool: string,
  config: { endpoint: string }
) => {
  const provider = new WsProvider(config.endpoint);
  const api = await ApiPromise.create({ provider });
  const transport = new WebSocketTransport(config.endpoint);
  const client = new Client(new RequestManager([transport]));

  listener.subscribe(async (res) => {
    const height = parseFloat(
      res.tags.find((tag) => tag.name === "Height")?.value!
    );

    const { block } = await parseBlockByNumber(height, api, client);
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
