import { ActionInterface, LockInterface, StateInterface } from "../faces";

declare const ContractError: any;

export const Lock = (state: StateInterface, action: ActionInterface) => {
  const balances = state.balances;
  const caller = action.caller;
  const pools = state.pools;

  const input: LockInterface = action.input;
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
  if (id !== undefined) {
    if (!Number.isInteger(id)) {
      throw new ContractError(
        `Invalid value for "id". Must be an integer or undefined.`
      );
    }
    if (id >= pools.length || id < 0) {
      throw new ContractError(`Invalid pool id.`);
    }
  }

  // if id is provided tokens get locked into pool vault
  let vault;
  if (Number.isInteger(id)) {
    vault = pools[id].vault;
  } else {
    vault = state.vault;
  }

  balances[caller] -= qty;
  if (caller in vault) {
    vault[caller] += qty;
  } else {
    vault[caller] = qty;
  }

  return { ...state, balances, pools };
};
