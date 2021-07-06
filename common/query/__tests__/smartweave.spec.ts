import { readContract } from "../src/smartweave";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

export const { assert, expect } = chai;

describe("Test SmartWeave", () => {
  describe("Getting the latest state", async () => {
    it("Loads the last contract state", async () => {
      const data = await readContract(
        "l6S4oMyzw_rggjt4yt4LrnRmggHQ2CdM1hna2MK4o_c",
        "OrO8n453N6bx921wtsEs-0OCImBLCItNU5oSbFKlFuU",
        false
      );
    }).timeout(60 * 1000);
  }).timeout(60 * 1000);
});
