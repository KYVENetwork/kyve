import { ActionInterface, StateInterface, UnregisterInterface } from "../faces";

declare const ContractError: any;

export const Unregister = (state: StateInterface, action: ActionInterface) => {
  const caller = action.caller;
  const pools = state.pools;
  const input: UnregisterInterface = action.input;

  const registered = new Set(pools[input.id].registered);

  if (input.id >= pools.length || input.id < 0) {
    throw new ContractError(`Invalid pool id.`);
  }

  if (!registered.has(caller)) {
    throw new ContractError(`Caller not registered.`);
  }

  registered.delete(caller);

  pools[input.id].registered = Array.from(registered);

  return { ...state, pools };
};
