import { ActionInterface, StateInterface, UnlockInterface } from "../faces";

declare const ContractError: any;

export const Unlock = (state: StateInterface, action: ActionInterface) => {
  const balances = state.balances;
  const caller = action.caller;
  const pools = state.pools;

  const input: UnlockInterface = action.input;
  const id = input.id;

  let vault;
  if (Number.isInteger(id)) {
    if (id >= pools.length || id < 0) {
      throw new ContractError(`Invalid pool id.`);
    }

    const pool = pools[id];

    if (pool.uploader === caller) {
      throw new ContractError(
        `Caller can't unlock as they are the current uploader.`
      );
    }
    if (pool.registered.indexOf(caller) >= 0) {
      throw new ContractError(
        `Caller can't unlock as they are currently registered.`
      );
    }

    vault = pool.vault;
  } else {
    vault = state.vault;
  }

  if (!(caller in vault)) {
    throw new ContractError(`Caller doesn't have any tokens locked.`);
  }

  const qty = vault[caller];
  balances[caller] += qty;
  delete vault[caller];

  return { ...state, balances, pools };
};
