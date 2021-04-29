import { ActionInterface, StateInterface, VoteInterface } from "../faces";

declare const ContractError: any;
declare const SmartWeave: any;

export const Vote = (state: StateInterface, action: ActionInterface) => {
  const votes = state.votes;
  const caller = action.caller;

  const input: VoteInterface = action.input;
  const id = input.id;
  const cast = input.cast;

  if (id >= votes.length) {
    throw new ContractError(`Invalid vote id.`);
  }

  if (Object.keys(state.vault).indexOf(caller) < 0) {
    throw new ContractError(`Caller is not staked in global vault`);
  }

  const vote = votes[id];

  const yays = new Set(vote.yays);
  const nays = new Set(vote.nays);

  if (vote.status !== "pending" || vote.end < SmartWeave.block.height) {
    throw new ContractError(`Vote is no longer active.`);
  }
  if (yays.has(caller) || nays.has(caller)) {
    throw new ContractError(`Caller has already voted.`);
  }

  if (cast === "yay") {
    yays.add(caller);
  } else if (cast === "nay") {
    nays.add(caller);
  } else {
    throw new ContractError(`Invalid vote cast.`);
  }

  vote.yays = Array.from(yays);
  vote.nays = Array.from(nays);

  return { ...state, votes };
};
