import smartweave, { copy, expect } from "../../src/utils";
import {
  DenyInterface,
  FundPoolInterface,
  StateInterface,
} from "../../src/faces";

describe("Fund Pool Tests", () => {
  const initialState = copy(smartweave.state as StateInterface);

  const poolID = 0;
  const qty = 10;
  let state: StateInterface;
  it("Increases pools balance by qty.", async () => {
    const input: FundPoolInterface = {
      function: "fund",
      id: poolID,
      qty: qty,
    };
    state = await smartweave.execute(input);
    expect(
      state.pools[poolID].balance - initialState.pools[poolID].balance
    ).to.equal(qty);

    smartweave.state = initialState;
  });
});
