import smartweave, { copy, expect } from "../../src/utils";
import { StateInterface, TransferInterface } from "../../src/faces";

describe("Transfer Tests", () => {
  let qty = 10;
  let target = "myTestAddr";
  let input: TransferInterface = { function: "transfer", qty, target };

  let initialState: StateInterface;
  let state: StateInterface;

  it("Transfers tokens to address", async () => {
    initialState = copy(smartweave.state as StateInterface);
    state = await smartweave.execute(input);
  });

  it("Reduces callers balance by amount", () => {
    // check if balances of caller has been reduced by amount
    const oldBalance = initialState.balances[smartweave.caller];
    const newBalance = state.balances[smartweave.caller];

    expect(newBalance).to.equal(oldBalance - qty);
  });

  it("Reduces increases targets balance by amount", () => {
    // check if balances of target has been increased by amount
    expect(state.balances[target]).to.equal(qty);
    smartweave.state = initialState;
  });
});
