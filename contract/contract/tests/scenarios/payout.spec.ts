import smartweave, { copy, expect } from "../../src/utils";
import {
  DenyInterface,
  FundPoolInterface,
  LockInterface,
  PayoutInterface,
  RegisterInterface,
  StateInterface,
} from "../../src/faces";

describe("Payout Tests", () => {
  const initialState = copy(smartweave.state as StateInterface);

  smartweave.block.height = 0;

  const poolID = 0;
  const qty = 10;
  let state: StateInterface;

  it("Raises an error when payout period is not over.", async () => {
    const input: PayoutInterface = {
      function: "payout",
      id: poolID,
    };
    await expect(smartweave.execute(input)).to.be.rejectedWith(
      "It hasn't been 150 blocks since the last payout."
    );
  });

  // register caller
  it("Stakes callers tokens in pool", async () => {
    let input: LockInterface = {
      function: "lock",
      qty: 10,
      id: poolID,
    };
    state = await smartweave.execute(input);
  });

  it("Allows caller to register in pool", async () => {
    let input: RegisterInterface = { function: "register", id: poolID };
    state = await smartweave.execute(input);

    expect(state.pools[poolID].registered).to.include(smartweave.caller);
  });

  it("Is successful when payout period is over", async () => {
    smartweave.block.height += 150;
    const input: PayoutInterface = {
      function: "payout",
      id: poolID,
    };
    state = await smartweave.execute(input);
  });

  it("Increases uploader balance by uploader payout rate", async () => {
    const uploader = initialState.pools[poolID].uploader;

    const oldBalance = initialState.balances[uploader];
    const newBalance = state.balances[uploader];

    const payoutRate = state.pools[poolID].rates.uploader;
    expect(oldBalance + payoutRate).to.equal(newBalance);
  });

  it("Increases validators balance by validator payout rate", async () => {
    const validator = smartweave.caller;

    const oldBalance = initialState.balances[validator] - 10; //locked token
    const newBalance = state.balances[validator];

    const payoutRate = state.pools[poolID].rates.validator;
    expect(oldBalance + payoutRate).to.equal(newBalance);
  });

  it("Decreases pools balance by uploader and validator payout rate", async () => {
    const oldBalance = initialState.pools[poolID].balance;
    const newBalance = state.pools[poolID].balance;
    const payoutRate =
      state.pools[poolID].rates.uploader + state.pools[poolID].rates.validator;
    expect(oldBalance - payoutRate).to.equal(newBalance);
  });

  it("Sets last payout to new block height", async () => {
    expect(state.pools[poolID].lastPayout).to.equal(
      smartweave.block.height - 1
    );
  });

  after(() => {
    smartweave.state = initialState;
  });
});
