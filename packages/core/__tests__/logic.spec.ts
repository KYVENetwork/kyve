import KYVE from "../src/index";

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

export const {assert, expect} = chai;


describe("Test logic", () => {
  it("Initiate a KYVE Instance", async () => {
    /*
    const instance = new KYVE(
      {
        pool: 0,
        stake: 0,
        jwk: undefined,
      },
      () => true,
      () => true
    );*/
  }).timeout(60 * 1000);
});