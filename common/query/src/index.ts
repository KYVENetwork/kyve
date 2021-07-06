import ArDB from "ardb";
import { APP_NAME, getData } from "@kyve/core";
import { arweaveClient } from "@kyve/core/dist/extensions";
import { GQLEdgeTransactionInterface } from "ardb/lib/faces/gql";
import Arweave from "arweave";
export { readContract } from "./smartweave"

type TransactionID = string;
type TransactionData = string;

export class Query extends ArDB {
  private poolID: string;
  public deRef: boolean;

  constructor(
    poolID: string,
    deRef: boolean = true,
    arweave: Arweave = arweaveClient
  ) {
    super(arweave);
    // default tags
    super.only(["id"]);
    super.limit(10);
    this.poolID = poolID;
    this.deRef = deRef;
  }

  async find() {
    super.tag("Application", APP_NAME);
    super.tag("Pool", this.poolID);
    const res = (await super.find()) as GQLEdgeTransactionInterface[];
    const ret: any[] = [];

    for (let { node } of res) {
      if (this.deRef) {
        const data = await getData(node.id);
        ret.push(data);
      } else {
        ret.push(node);
      }
    }
    return ret;
  }

  async next() {
    const res = (await super.next()) as GQLEdgeTransactionInterface[];
    const ret: any[] = [];

    for (let { node } of res) {
      const txID = node.id;
      if (this.deRef) {
        const data = await getData(txID);
        ret.push(data);
      } else {
        ret.push(txID);
      }
    }
    return ret;
  }
}
