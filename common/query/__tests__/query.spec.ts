import { Query } from "../src";
import { GQLEdgeTransactionInterface } from "ardb/lib/faces/gql";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

export const { assert, expect } = chai;

describe("Test Query", () => {
  describe("With DeRef", () => {
    const query = new Query(0);

    it("Loads data", async () => {
      const data: any[] = await query.find();

      expect(data.length).to.equal(10);
    }).timeout(60 * 1000);

    it("Loads next data", async () => {
      const limit = 10;
      const data: any[] = await query.next();

      expect(data.length).to.equal(limit);
    }).timeout(60 * 1000);
  }).timeout(60 * 1000);

  describe("Without DeRef", () => {
    const query = new Query(0, false);

    it("Loads data", async () => {
      const limit = 10;
      const data: any[] = await query.limit(limit).find();

      expect(data.length).to.equal(limit);
    }).timeout(60 * 1000);

    it("Loads next data", async () => {
      const limit = 10;
      const data: any[] = await query.next();

      expect(data.length).to.equal(limit);
    }).timeout(60 * 1000);
  });
});
