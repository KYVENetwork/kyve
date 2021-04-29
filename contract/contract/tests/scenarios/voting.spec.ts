import { assert } from "chai";
import smartweave, { expect } from "../../src/utils";

describe("Voting Tests", () => {
  let state;

  it("Lock callers tokens.", async () => {
    state = await smartweave.execute({
      function: "lock",
      qty: 10,
    });

    expect(state.vault[smartweave.caller]).to.equal(10);
  });

  describe("Mint Vote Tests", () => {
    let state;
    // Mint Vote
    it("Assert new mint vote was created.", async () => {
      state = await smartweave.execute({
        function: "propose",
        type: "mint",
        target: "feXSjpWp0gTkr4201FzYwzTXnuxlUqtrhhw59YyP8I4",
        qty: 50,
      });

      expect(state.votes[0]).to.exist;
    });

    it("Assert a new response to vote has been parsed.", async () => {
      state = await smartweave.execute({
        function: "vote",
        id: 0,
        cast: "yay",
      });
      expect(state.votes[0].yays).to.include(smartweave.caller);
    });

    it("Assert the vote passes, and tokens are minted.", async () => {
      smartweave.block.height += 100;
      state = await smartweave.execute({
        function: "finalize",
        id: 0,
      });
      expect(state.votes[0].status).to.equal("passed");
      expect(
        state.balances["feXSjpWp0gTkr4201FzYwzTXnuxlUqtrhhw59YyP8I4"]
      ).to.equal(50);
    });
  });

  describe("Burn Vote Tests", () => {
    let state;
    // Mint Vote
    it("Assert new burn vote was created.", async () => {
      state = await smartweave.execute({
        function: "propose",
        type: "burn",
        target: "feXSjpWp0gTkr4201FzYwzTXnuxlUqtrhhw59YyP8I4",
        qty: 50,
      });

      expect(state.votes[1]).to.exist;
    });

    it("Assert a new response to vote has been parsed.", async () => {
      state = await smartweave.execute({
        function: "vote",
        id: 1,
        cast: "yay",
      });

      expect(state.votes[1].yays).to.include(smartweave.caller);
    });

    it("Assert the vote passes, and tokens are burned.", async () => {
      smartweave.block.height += 100;
      state = await smartweave.execute({
        function: "finalize",
        id: 1,
      });

      expect(state.votes[1].status).to.equal("passed");
      expect(
        state.balances["feXSjpWp0gTkr4201FzYwzTXnuxlUqtrhhw59YyP8I4"]
      ).to.equal(0);
    });
  });

  describe("UpdatePool Vote Tests", () => {
    let state;

    // UpdatePool Vote
    it("Assert new updatePool vote was created.", async () => {
      state = await smartweave.execute({
        function: "propose",
        type: "updatePool",
        id: 1,
        pool: {
          uploader: "feXSjpWp0gTkr4201FzYwzTXnuxlUqtrhhw59YyP8I4",
        },
      });
      expect(state.votes[2]).to.exist;
    });

    // UpdatePool Vote
    it("Assert new updatePool to fail on invalid input.", async () => {
      await expect(
        smartweave.execute({
          function: "propose",
          type: "updatePool",
          id: undefined,
          pool: {
            uploader: "feXSjpWp0gTkr4201FzYwzTXnuxlUqtrhhw59YyP8I4",
          },
        })
      ).to.be.rejectedWith("Please add 'id' and 'pool' information");
    });

    it("Assert a new response to vote has been parsed.", async () => {
      state = await smartweave.execute({
        function: "vote",
        id: 2,
        cast: "yay",
      });

      expect(state.votes[2].yays).to.include(smartweave.caller);
    });

    it("Assert the vote passes, and the uploader is set.", async () => {
      smartweave.block.height += 100;
      state = await smartweave.execute({
        function: "finalize",
        id: 2,
      });
      expect(state.votes[2].status).to.equal("passed");
      expect(state.pools[1].uploader).to.equal(
        "feXSjpWp0gTkr4201FzYwzTXnuxlUqtrhhw59YyP8I4"
      );
    });
  });
});
