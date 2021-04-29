import smartweave, { copy, expect } from "../../src/utils";
import {
  LockInterface,
  StateInterface,
  UnlockInterface,
  UnregisterInterface,
} from "../../src/faces";

describe("Locking & Unlocking tokens in pool", () => {
  let poolID = 0;
  let lockAmount = 10;

  const initialState = copy(smartweave.state as StateInterface);
  let state: StateInterface;

  describe("Locking tokens", () => {
    it("Locks callers tokens in pool", async () => {
      let input: LockInterface = {
        function: "lock",
        qty: lockAmount,
        id: poolID,
      };
      state = await smartweave.execute(input);
    });

    it("Reduces callers balance", async () => {
      const initialBalance = initialState.balances[smartweave.caller];
      const newBalance = state.balances[smartweave.caller];

      expect(newBalance).to.equal(initialBalance - lockAmount);
    });

    it("Increases callers vault at pool", async () => {
      const initialVaultBalance =
        initialState.pools[poolID].vault[smartweave.caller] || 0;
      const vaultBalance = state.pools[poolID].vault[smartweave.caller];

      expect(vaultBalance).to.equal(initialVaultBalance + lockAmount);
    });
  });

  describe("Unlocking tokens", () => {
    it("Raises an error when caller is registered in pool", async () => {
      let input: UnlockInterface = { function: "unlock", id: poolID };
      await expect(smartweave.execute(input)).to.be.rejectedWith(
        "Caller can't unlock as they are currently registered."
      );
    });

    it("Unregisters caller", async () => {
      let input: UnregisterInterface = { function: "unregister", id: poolID };
      await expect(smartweave.execute(input));
    });

    it("Unlocks callers tokens in pool", async () => {
      let input: UnlockInterface = { function: "unlock", id: poolID };
      state = await smartweave.execute(input);
    });

    it("Sets callers vault to 0", async () => {
      expect(state.pools[poolID].vault[smartweave.caller]).to.be.undefined;
    });

    it("Increases callers balance", async () => {
      const initialBalance = initialState.balances[smartweave.caller];
      const newBalance = state.balances[smartweave.caller];
      expect(newBalance).to.equal(initialBalance);
    });
  });
});
