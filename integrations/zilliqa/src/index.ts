import {
  ListenFunctionObservable,
  ListenFunctionReturn,
  UploadFunctionSubscriber,
  ValidateFunctionSubscriber,
} from "@kyve/core/dist/faces";

import { GQLTagInterface } from "ardb/lib/faces/gql";

import hash from "object-hash";
import KYVE from "@kyve/core";
import { JWKInterface } from "arweave/node/lib/wallet";

import { Zilliqa } from "@zilliqa-js/zilliqa";

// import {TransactionObj, TxBlockObj} from "@zilliqa-js/core/src/types";

// overload default block
/*
export interface ZilliqaBlock extends TxBlockObj{
  transactions: TransactionObj[]
}
*/

export const upload = async (
  uploader: UploadFunctionSubscriber,
  config: any
) => {
  const zilliqa = new Zilliqa(config.api);
  const subscriber = zilliqa.subscriptionBuilder.buildNewBlockSubscriptions(
    config.endpoint
  );

  subscriber.emitter.on("NewBlock", async (event: any) => {
    const hash = event.value.TxBlock.body.BlockHash;
    const BlockNum = event.value.TxBlock.header.BlockNum.toString();
    console.log("Hash", hash, "BlockNum", BlockNum);

    /*
    let block = (await zilliqa.blockchain.getTxBlock(BlockNum)).result as ZilliqaBlock;
    block.transactions = (await zilliqa.blockchain.getTxnBodiesForTxBlock(
      BlockNum
    )).result as TransactionObj[];
     */

    let block: any;
    try {
      block = (await zilliqa.blockchain.getTxBlock(BlockNum)).result as any;
    } catch (error) {
      // in case of an error don't send any data
      console.log("block", error);
      return;
    }

    // use empty-array in case of no transactions
    block.transactions = [] as any[];

    if (block.header.NumTxns === 0) {
      // If there are no transactions page will be 1.
      // We always want to upload a block.
      const tags = [
        { name: "Block", value: hash },
        { name: "BlockNum", value: BlockNum.toString() },
        { name: "Page", value: "1" },
        { name: "Max-Pages", value: "1" },
      ];

      uploader.next({ data: block, tags });
    } else {

      let transactions: any[] = [];
      // fetch transactions
      try {
        transactions = (
          await zilliqa.blockchain.getTxnBodiesForTxBlock(BlockNum)
        ).result as any;
      } catch (error) {
        // in case of an error don't send any data
        console.log("transactions", error);
        return;
      }

      let page = 1;

      const chunkSize = 50;
      const maxPages = Math.ceil(transactions.length / chunkSize);

      for (let i = 0; i < transactions.length; i += chunkSize) {
        // slice transactions into chunks and map them into the block
        block.transactions = transactions
          .slice(i, i + chunkSize);

        // upload chunk
        const tags = [
          { name: "Block", value: hash },
          { name: "BlockNum", value: BlockNum.toString() },
          { name: "Page", value: page.toString() },
          { name: "Max-Pages", value: maxPages.toString() },
        ];

        block.transactions.map((transaction: any) =>
          tags.push({ name: "Transaction", value: transaction.ID })
        );

        uploader.next({ data: block, tags });

        page += 1;
      }
    }
  });

  subscriber.start();
};

export const validate = async (
  listener: ListenFunctionObservable,
  validator: ValidateFunctionSubscriber,
  config: any
) => {
  const zilliqa = new Zilliqa(config.api);

  listener.subscribe(async (res: ListenFunctionReturn) => {
    const index = res.transaction.tags.findIndex(
      (tag: GQLTagInterface) =>
        tag.name === "Block" && tag.value === res.data.body.BlockHash
    );
    const BlockNum = parseInt(res.transaction.tags[index + 1].value);
    const page = parseInt(res.transaction.tags[index + 2].value);

    /*
    let block = (await zilliqa.blockchain.getTxBlock(BlockNum)).result as ZilliqaBlock;
    block.transactions = (await zilliqa.blockchain.getTxnBodiesForTxBlock(
      BlockNum
    )).result as TransactionObj[];
    */

    let block = (await zilliqa.blockchain.getTxBlock(BlockNum)).result as any;
    block.transactions = [] as any[];

    if (block.header.NumTxns > 0) {
      let transactions: any[] = [];
      try {
        transactions = (
          await zilliqa.blockchain.getTxnBodiesForTxBlock(BlockNum)
        ).result as any;
      } catch (error) {
        // in case of an error don't send any data
        console.log("transactions", error);
        return;
      }

      const chunkSize = 50;
      let i = (page - 1) * chunkSize;
      let maxPages = Math.ceil(transactions.length / chunkSize);
      maxPages = maxPages == 0 ? 1 : maxPages;
      if (transactions != null && transactions.length > 0) {
        block.transactions = transactions
          .slice(i, i + chunkSize);
      }
    }

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
