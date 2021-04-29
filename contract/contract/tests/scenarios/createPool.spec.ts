import smartweave, { expect } from "../../src/utils";
import { CreatePoolInterface, StateInterface } from "../../src/faces";

describe("CreatePool Tests", () => {
  let state: StateInterface;
  it("Creates a new pool.", async () => {
    const input: CreatePoolInterface = {
      function: "createPool",
      name: "Avalanche // X-Chain",
      architecture: "Avalanche",
      config: { endpoint: "wss://api.avax.network/ext/bc/X/ws" },
    };
    state = await smartweave.execute(input);
    expect(state.pools[1]).to.exist;
    expect(state.pools[1].name).to.equal("Avalanche // X-Chain");
  });
});
