import { ActionInterface, CreditInterface, StateInterface } from "../faces";
import { GetTransferAmount } from "../utils/transfer";

declare const ContractAssert: any;

export const Fund = async (state: StateInterface, action: ActionInterface) => {
  const credit = state.credit;
  const caller = action.caller;

  const input: CreditInterface = action.input;
  let qty: number;

  if (input.qty) {
    qty = input.qty;

    ContractAssert(caller in credit, "Caller has no balance in the pool.");
    ContractAssert(
      credit[caller].amount >= qty,
      "Caller can't fund more than they have."
    );

    credit[caller].amount -= qty;
  } else {
    qty = await GetTransferAmount(state);
  }

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
