import { ActionInterface, ProposeInterface, StateInterface } from "../faces";

declare const SmartWeave: any;
declare const ContractError: any;

export const Propose = (state: StateInterface, action: ActionInterface) => {
  const votes = state.votes;

  const input: ProposeInterface = action.input;
  const type = input.type;

  let metadata;
  switch (type) {
    case "mint":
      if (!input.target || !input.qty) {
        throw new ContractError("Please add 'target' and 'qty' information");
      }
      metadata = {
        target: input.target,
        qty: input.qty,
      };
      break;
    case "burn":
      if (!input.target || !input.qty) {
        throw new ContractError("Please add 'target' and 'qty' information");
      }
      metadata = {
        target: input.target,
        qty: input.qty,
      };
      break;
    case "updatePool":
      // todo fix 0 issue
      if (!(input.id && input.pool)) {
        throw new ContractError("Please add 'id' and 'pool' information");
      }
      metadata = {
        id: input.id,
        pool: input.pool,
      };
      break;
  }

  votes.push({
    status: "pending",
    start: SmartWeave.block.height,
    end: SmartWeave.block.height + 100,
    type,
    yays: [],
    nays: [],
    metadata,
  });

  return { ...state, votes };
};
