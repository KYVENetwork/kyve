import smartweave, { copy, expect } from "../../src/utils";
import { MigrateInterface, StateInterface } from "../../src/faces";

describe("Migrate Tests", () => {
  let initialState: StateInterface;
  let state: StateInterface;

  before(() => {
    smartweave.caller = "cMM3SKregpSdGFhlMEEsU1nxeWFKAkKOCFaom4nKh7U";
    initialState = copy(smartweave.state as StateInterface);
  });

  it("Fails when other address tries to migrate", async () => {
    smartweave.caller = "fails";
    const input: MigrateInterface = {
      function: "migrate",
    };
    await expect(smartweave.execute(input)).to.be.rejectedWith(
      "Caller is not allowed to migrate."
    );
    smartweave.caller = "cMM3SKregpSdGFhlMEEsU1nxeWFKAkKOCFaom4nKh7U";
  });

  it("Migrates the contract", async () => {
    const input: MigrateInterface = {
      function: "migrate",
    };
    state = await smartweave.execute(input);
  });

  it("Sets migrated to true", async () => {
    expect(state.migrated).to.be.true;
  });

  it("Blocks any other interaction", async () => {
    await expect(
      smartweave.execute({ function: "dispense" })
    ).to.be.rejectedWith("This contract has been migrated");
  });

  after(() => {
    smartweave.caller = "vxUdiv2fGHMiIoek5E4l3M5qSuKCZtSaOBYjMRc94JU";
    smartweave.state = initialState;
  });
});
