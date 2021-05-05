import {
  UploadFunctionSubscriber,
  ListenFunctionObservable,
  ValidateFunctionSubscriber,
  ListenFunctionReturn,
} from "@kyve/core/dist/faces";
import hash from "object-hash";
import KYVE from "@kyve/core";
import { JWKInterface } from "arweave/node/lib/wallet";

const { Zilliqa } = require('@zilliqa-js/zilliqa');

const upload = async (uploader: UploadFunctionSubscriber, config: any) => {

  const zilliqa = new Zilliqa(config.api);
  const subscriber = zilliqa.subscriptionBuilder.buildNewBlockSubscriptions(
    config.endpoint,
  );

  subscriber.emitter.on("NewBlock", async (event: any) => {
    let hash = event.value.TxBlock.body.BlockHash;
    let BlockNum = event.value.TxBlock.header.BlockNum.toString();

    let block = await zilliqa.blockchain.getTxBlock(BlockNum).result;
    block.transactions =  await zilliqa.blockchain.getTxnBodiesForTxBlock(BlockNum).result;

    const tags = [
      { name: "Block", value: hash },
      { name: "BlockNum", value: BlockNum.toString() },
    ];

    block.transactions.map((transaction : any) =>
      tags.push({ name: "Transaction", value: transaction.ID })
    );

    uploader.next({ data: block, tags });

  });

  subscriber.start();
};

const validate = async (
  listener: ListenFunctionObservable,
  validator: ValidateFunctionSubscriber,
  config: any
) => {
  const zilliqa = new Zilliqa(config.api);
  
  listener.subscribe(async (res: ListenFunctionReturn) => {
    const index = res.transaction.tags.findIndex(
      (tag) => tag.name === "Block" && tag.value === res.data.body.BlockHash
    );
    const BlockNum = res.transaction.tags[index + 1].value;

    let block = await zilliqa.blockchain.getTxBlock(BlockNum).result;
    block.transactions =  await zilliqa.blockchain.getTxnBodiesForTxBlock(BlockNum).result;

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
