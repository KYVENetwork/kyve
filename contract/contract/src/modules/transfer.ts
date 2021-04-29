import { ActionInterface, StateInterface, TransferInterface } from "../faces";

declare const ContractError: any;

export const Transfer = (state: StateInterface, action: ActionInterface) => {
  const balances = state.balances;
  const caller = action.caller;

  const input: TransferInterface = action.input;
  const target = input.target;
  const qty = input.qty;

  if (!Number.isInteger(qty)) {
    throw new ContractError(`Invalid value for "qty". Must be an integer.`);
  }
  if (!target) {
    throw new ContractError(`No target specified.`);
  }
  if (qty <= 0 || caller === target) {
    throw new ContractError(`Invalid token transfer.`);
  }
  if (!(caller in balances)) {
    throw new ContractError(`Caller doesn't own any tokens.`);
  }
  if (balances[caller] < qty) {
    throw new ContractError(
      `Caller balance not high enough to send ${qty} token(s)!`
    );
  }

  balances[caller] -= qty;
  if (target in balances) {
    // Wallet already exists in state, add new tokens
    balances[target] += qty;
  } else {
    // Wallet is new, set starting balance
    balances[target] = qty;
  }

  return { ...state, balances };
};
