import smartweave, { copy, expect } from "../../src/utils";
import {
  LockInterface,
  StateInterface,
  UnlockInterface,
  UnregisterInterface,
} from "../../src/faces";

describe("Locking & Unlocking tokens in global vault", () => {
  let lockAmount = 10;

  const initialState = copy(smartweave.state as StateInterface);
  let state: StateInterface;

  describe("Locking tokens", () => {
    it("Locks callers tokens in global vault", async () => {
      let input: LockInterface = {
        function: "lock",
        qty: lockAmount,
      };
      state = await smartweave.execute(input);
    });

    it("Reduces callers balance", async () => {
      const initialBalance = initialState.balances[smartweave.caller];
      const newBalance = state.balances[smartweave.caller];

      expect(newBalance).to.equal(initialBalance - lockAmount);
    });

    it("Increases callers vault", async () => {
      const initialVaultBalance = initialState.vault[smartweave.caller] || 0;
      const vaultBalance = state.vault[smartweave.caller];

      expect(vaultBalance).to.equal(initialVaultBalance + lockAmount);
    });
  });

  describe("Unlocking tokens", () => {
    it("Unlocks callers tokens", async () => {
      let input: UnlockInterface = { function: "unlock" };
      state = await smartweave.execute(input);
    });

    it("Sets callers vault to 0", async () => {
      expect(state.vault[smartweave.caller]).to.be.undefined;
    });

    it("Increases callers balance", async () => {
      const initialBalance = initialState.balances[smartweave.caller];
      const newBalance = state.balances[smartweave.caller];
      expect(newBalance).to.equal(initialBalance);
    });
  });
});
