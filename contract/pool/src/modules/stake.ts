import { ActionInterface, CreditInterface, StateInterface } from "../faces";
import { GetTransferAmount } from "../utils/transfer";

declare const ContractAssert: any;

export const Stake = async (state: StateInterface, action: ActionInterface) => {
  const credit = state.credit;
  const caller = action.caller;

  const input: CreditInterface = action.input;
  let qty: number;

  if (input.qty) {
    qty = input.qty;

    ContractAssert(caller in credit, "Caller has no balance in the pool.");
    ContractAssert(
      credit[caller].amount >= qty,
      "Caller can't stake more than they have."
    );

    credit[caller].amount -= qty;
  } else {
    qty = await GetTransferAmount(state);
  }

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
