import smartweave, { copy, expect } from "../../src/utils";
import {
  LockInterface,
  RegisterInterface,
  StateInterface,
  UnlockInterface,
  UnregisterInterface,
} from "../../src/faces";

describe("Register & Unregister from pool", () => {
  let poolID = 0;
  let lockAmount = 10;

  const initialState = copy(smartweave.state as StateInterface);
  let state: StateInterface;

  describe("Register in pool", () => {
    it("Raises an error when caller does not have enough stake in pool", async () => {
      let input: RegisterInterface = { function: "register", id: poolID };
      await expect(smartweave.execute(input)).to.be.rejectedWith(
        "Caller has insufficient stake in pool: 0"
      );
    });

    it("Stakes callers tokens in pool", async () => {
      let input: LockInterface = {
        function: "lock",
        qty: lockAmount,
        id: poolID,
      };
      state = await smartweave.execute(input);
    });

    it("Allows caller to register in pool", async () => {
      let input: RegisterInterface = { function: "register", id: poolID };
      state = await smartweave.execute(input);

      expect(state.pools[poolID].registered).to.include(smartweave.caller);
    });
  });

  describe("Unregister from pool", () => {
    it("Allows caller to register in pool", async () => {
      let input: UnregisterInterface = { function: "unregister", id: poolID };
      state = await smartweave.execute(input);

      expect(state.pools[poolID].registered).not.to.include(smartweave.caller);
    });
  });
});
