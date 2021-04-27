import {next, query, Query} from "../src";
import {arweaveClient} from "@kyve/core/dist/extensions";
import {GQLEdgeTransactionInterface} from "ardb/lib/faces/gql";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

export const {assert, expect} = chai;

describe("Test query", () => {

  it("Loads data", async () => {
    const limit = 10;

    //const ids = await query(0, limit);
    const q = new Query(0, arweaveClient)
    const ids = await q.search().limit(2).find() as string[]
    console.log(ids)
    expect(ids.length).to.equal(limit);
  }).timeout(60 * 1000);

  it("Loads data", async () => {
    const limit = 10;

    const ids = await query(0, limit);
    console.log(ids)
    expect(ids.length).to.equal(limit);
  }).timeout(60 * 1000);

  it("Loads next data", async () => {
    const limit = 10;

    const ids = await next();
    expect(ids.length).to.equal(limit);
  }).timeout(60 * 1000);

  it("Derefs data", async () => {
    const limit = 10;

    const data = await query(0, limit, true);
    expect(data.length).to.equal(limit);
  }).timeout(60 * 1000);

  it("Derefs next data", async () => {
    const limit = 10;

    const data = await next(true);
    expect(data.length).to.equal(limit);
  }).timeout(60 * 1000);
});
