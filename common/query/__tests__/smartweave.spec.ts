import { readContract } from "../src/smartweave";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

export const { assert, expect } = chai;

describe("Test SmartWeave", () => {
  describe("Getting the latest state", async () => {
    it("Loads the last contract state", async () => {
      const data = await readContract(
        4,
        "cETTyJQYxJLVQ6nC3VxzsZf1x2-6TW2LFkGZa91gUWc",
        false
      );
    }).timeout(60 * 1000);
  }).timeout(60 * 1000);
});
