import { ActionInterface, CreditInterface, StateInterface } from "../faces";

declare const ContractAssert: any;
declare const SmartWeave: any;

export const Withdraw = (state: StateInterface, action: ActionInterface) => {
  const credit = state.credit;
  const foreignCalls = state.foreignCalls;
  const settings = state.settings;
  const caller = action.caller;

  const input: CreditInterface = action.input;
  const qty = input.qty;

  ContractAssert(caller in credit, "Caller is not in the pool.");
  ContractAssert(qty, "Invalid quantity specified.");
  ContractAssert(
    credit[caller].amount >= qty,
    "Caller does not have enough balance."
  );

  foreignCalls.push({
    txID: SmartWeave.transaction.id,
    contract: settings.foriegnContracts.governance,
    input: {
      function: "transfer",
      target: caller,
      qty,
    },
  });
  credit[caller].amount -= qty;

  return { ...state, credit, foreignCalls };
};
