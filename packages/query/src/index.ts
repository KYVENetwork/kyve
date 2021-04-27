import ArDB from "ardb";
import { APP_NAME, getData } from "@kyve/core";
import { arweaveClient } from "@kyve/core/dist/extensions";
import { GQLEdgeTransactionInterface } from "ardb/lib/faces/gql";
import Arweave from "arweave";

export const arDB = new ArDB(arweaveClient);

type TransactionID = string;
type TransactionData = string;

export class Query extends ArDB {
  private poolID: number;

  constructor(poolID: number, arweave: Arweave) {
    super(arweave);
    // default tags
    super.only(["id"]);
    this.poolID = poolID;
  }

  async find(): Promise<any> {
    super.tag("Application", APP_NAME);
    super.tag("Pool", this.poolID.toString());
    const res = (await super.find()) as GQLEdgeTransactionInterface[];
    const ret: string[] = [];
    for (let { node } of res) {
      ret.push(node.id);
    }
    return ret;
  }
}

export const query = async (
  poolID: number,
  limit: number = 100,
  deRef: boolean = false
): Promise<TransactionID[]> => {
  const ids: TransactionID[] | TransactionData[] = [];

  const result = (await arDB
    .search()
    .tag("Application", APP_NAME)
    .tag("Pool", poolID.toString())
    .limit(limit)
    .only(["id", "block.height"])
    .find()) as GQLEdgeTransactionInterface[];

  for (let transaction of result) {
    const txID = transaction.node.id;
    console.log(transaction.node.block.height);
    if (deRef) {
      const data = await getData(txID);
      ids.push(data);
    } else {
      ids.push(txID);
    }
  }

  return ids;
};

export const next = async (deRef: boolean = false) => {
  const ids: TransactionID[] | TransactionData[] = [];

  const result = (await arDB.next()) as GQLEdgeTransactionInterface[];

  for (let transaction of result) {
    const txID = transaction.node.id;
    if (deRef) {
      const data = await getData(txID);
      ids.push(data);
    } else {
      ids.push(txID);
    }
  }

  return ids;
};
