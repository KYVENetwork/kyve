import smartweave, { expect } from "../../src/utils";
import { DenyInterface, StateInterface } from "../../src/faces";

describe("Deny Tests", () => {
  let state: StateInterface;
  it("Assert address has been added to list of denials.", async () => {
    const input: DenyInterface = {
      function: "deny",
      id: 0,
    };
    state = await smartweave.execute(input);
    expect(state.pools[0].registered).to.include(smartweave.caller);
  });
});
