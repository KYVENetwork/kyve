import { ActionInterface, FundPoolInterface, StateInterface } from "../faces";

declare const ContractError: any;

export const FundPool = (state: StateInterface, action: ActionInterface) => {
  const balances = state.balances;
  const caller = action.caller;
  const pools = state.pools;

  const input: FundPoolInterface = action.input;
  const id = input.id;
  const qty = input.qty;

  if (!Number.isInteger(qty)) {
    throw new ContractError(`Invalid value for "qty". Must be an integer.`);
  }
  if (qty <= 0) {
    throw new ContractError(`Invalid funding amount.`);
  }
  if (!(caller in balances)) {
    throw new ContractError(`Caller doesn't own any tokens.`);
  }
  if (balances[caller] < qty) {
    throw new ContractError(
      `Caller balance not high enough to send ${qty} token(s)!`
    );
  }
  if (id >= pools.length) {
    throw new ContractError(`Invalid pool id.`);
  }

  balances[caller] -= qty;
  pools[id].balance += qty;

  return { ...state, balances, pools };
};
