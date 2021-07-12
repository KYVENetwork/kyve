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

export const upload = async (
  uploader: UploadFunctionSubscriber,
  config: any
) => {
  const provider = new WsProvider(config.endpoint);
  const api = await ApiPromise.create({ provider });

  api.rpc.chain.subscribeFinalizedHeads(async (header: Header) => {
    const { block, tags } = await parseBlockByNumber(
      header.number.toNumber(),
      api
    );

    uploader.next({ data: block, tags });
  });
};

export const validate = async (
  listener: ListenFunctionObservable,
  validator: ValidateFunctionSubscriber,
  config: any
) => {
  const provider = new WsProvider(config.endpoint);
  const api = await ApiPromise.create({ provider });

  listener.subscribe(async (res) => {
    const height = parseFloat(
      res.transaction.tags.find((tag) => tag.name === "Height")?.value!
    );

    const { block } = await parseBlockByNumber(height, api);
    const localHash = hash(block);

    const data = await getData(res.id);
    const compareHash = hash(JSON.parse(data.toString()));

    validator.next({ valid: localHash === compareHash, id: res.id });
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
