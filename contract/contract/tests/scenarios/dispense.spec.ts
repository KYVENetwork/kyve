import smartweave, { copy, expect } from "../../src/utils";
import { StateInterface } from "../../src/faces";

describe("Dispense Tests", () => {
  const initialState = copy(smartweave.state as StateInterface);
  let state: StateInterface;

  it("Assert tokens have been deposited.", async () => {
    state = await smartweave.execute({ function: "dispense" });

    const newBalance = state.balances[smartweave.caller];
    const oldBalance = initialState.balances[smartweave.caller];
    expect(newBalance - oldBalance).to.equal(100);

    smartweave.state = initialState;
  });
});
