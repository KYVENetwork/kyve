import { APP_NAME, getData } from "@kyve/core";
import { client } from "@kyve/core/dist/utils/arweave";
import ArDB from "ardb";
import ArdbTransaction from "ardb/lib/models/transaction";
import Arweave from "arweave";
export { KyveBlockHeightCache } from "./smartweave";

type TransactionID = string;
type TransactionData = string;

export class Query extends ArDB {
  private poolID: string;
  public deRef: boolean;

  constructor(
    poolID: string,
    deRef: boolean = true,
    arweave: Arweave = client
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
    const res = (await super.find()) as ArdbTransaction[];
    const ret: any[] = [];

    for (let tx of res) {
      if (this.deRef) {
        const data = await getData(tx.id);
        ret.push(data);
      } else {
        ret.push(tx);
      }
    }
    return ret;
  }

  async next() {
    const res = (await super.next()) as ArdbTransaction[];
    const ret: any[] = [];

    for (let { id } of res) {
      if (this.deRef) {
        const data = await getData(id);
        ret.push(data);
      } else {
        ret.push(id);
      }
    }
    return ret;
  }
}
