import { ActionInterface, StateInterface } from "../faces";

export const Dispense = (state: StateInterface, action: ActionInterface) => {
  const balances = state.balances;
  const caller = action.caller;

  if (caller in balances) {
    // Wallet already exists in state, add new tokens
    balances[caller] += 100;
  } else {
    // Wallet is new, set starting balance
    balances[caller] = 100;
  }

  return { ...state, balances };
};
