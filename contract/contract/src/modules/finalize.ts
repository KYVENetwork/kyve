import { ActionInterface, FinalizeInterface, StateInterface } from "../faces";

declare const ContractError: any;
declare const SmartWeave: any;

export const Finalize = (state: StateInterface, action: ActionInterface) => {
  const votes = state.votes;
  const balances = state.balances;
  const pools = state.pools;

  const input: FinalizeInterface = action.input;
  const id = input.id;

  if (id >= votes.length) {
    throw new ContractError(`Invalid vote id.`);
  }
  if (
    votes[id].status !== "pending" ||
    votes[id].end > SmartWeave.block.height
  ) {
    throw new ContractError(`Can't finalize vote.`);
  }

  const passed = votes[id].yays.length > votes[id].nays.length;
  if (passed) {
    votes[id].status = "passed";

    switch (votes[id].type) {
      case "mint":
        {
          const target = votes[id].metadata.target;
          const qty = votes[id].metadata.qty;

          if (target in balances) {
            balances[target] += qty;
          } else {
            balances[target] = qty;
          }
        }
        break;
      case "burn":
        {
          const target = votes[id].metadata.target;
          const qty = votes[id].metadata.qty;

          if (target in balances) {
            if (balances[target] < qty) {
              balances[target] = 0;
            } else {
              balances[target] -= qty;
            }
          }
        }
        break;
      case "updatePool": {
        const poolID = votes[id].metadata.id;
        const pool = votes[id].metadata.pool;

        // @ts-ignore
        pools[poolID] = {
          ...pools[poolID],
          ...pool,
        };
      }
    }
  } else {
    votes[id].status = "failed";
  }

  return { ...state, votes, balances, pools };
};
