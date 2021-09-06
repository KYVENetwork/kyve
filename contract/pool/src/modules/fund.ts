import { ActionInterface, StateInterface } from "../faces";
import { GetTransferAmount } from "../utils/transfer";

export const Fund = async (state: StateInterface, action: ActionInterface) => {
  const credit = state.credit;
  const caller = action.caller;

  const qty = await GetTransferAmount(state);

  if (caller in credit) {
    credit[caller].fund += qty;
  } else {
    credit[caller] = {
      amount: 0,
      stake: 0,
      fund: qty,
      points: 0,
    };
  }

  return { ...state, credit };
};
