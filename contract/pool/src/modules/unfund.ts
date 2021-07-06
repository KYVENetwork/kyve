import { ActionInterface, CreditInterface, StateInterface } from "../faces";

declare const ContractAssert: any;

export const Unfund = (state: StateInterface, action: ActionInterface) => {
  const credit = state.credit;
  const caller = action.caller;

  const input: CreditInterface = action.input;
  const qty = input.qty;

  ContractAssert(caller in credit, "Caller has no balance in the pool.");
  ContractAssert(
    credit[caller].fund >= qty,
    "Caller can't unfund more than they have."
  );

  credit[caller].fund -= qty;
  credit[caller].amount += qty;

  return { ...state, credit };
};
