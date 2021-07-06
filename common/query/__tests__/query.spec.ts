import { Query } from "../src";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

export const { assert, expect } = chai;

describe("Test Query", () => {
  describe("With DeRef", () => {
    const query = new Query("l6S4oMyzw_rggjt4yt4LrnRmggHQ2CdM1hna2MK4o_c");

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
    const query = new Query(
      "l6S4oMyzw_rggjt4yt4LrnRmggHQ2CdM1hna2MK4o_c",
      false
    );

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
