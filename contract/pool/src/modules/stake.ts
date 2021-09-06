import { ActionInterface, StateInterface } from "../faces";
import { GetTransferAmount } from "../utils/transfer";

export const Stake = async (state: StateInterface, action: ActionInterface) => {
  const credit = state.credit;
  const caller = action.caller;

  const qty = await GetTransferAmount(state);

  if (caller in credit) {
    credit[caller].stake += qty;
  } else {
    credit[caller] = {
      amount: 0,
      stake: qty,
      fund: 0,
      points: 0,
    };
  }

  return { ...state, credit };
};
