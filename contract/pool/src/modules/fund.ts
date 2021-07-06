import { ActionInterface, CreditInterface, StateInterface } from "../faces";

declare const ContractAssert: any;

export const Fund = (state: StateInterface, action: ActionInterface) => {
  const credit = state.credit;
  const caller = action.caller;

  const input: CreditInterface = action.input;
  const qty = input.qty;

  ContractAssert(caller in credit, "Caller has no balance in the pool.");
  ContractAssert(
    credit[caller].amount >= qty,
    "Caller can't fund more than they have."
  );

  credit[caller].amount -= qty;
  credit[caller].fund += qty;

  return { ...state, credit };
};
