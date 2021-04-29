import { ActionInterface, DenyInterface, StateInterface } from "../faces";

declare const ContractError: any;

export const Deny = (state: StateInterface, action: ActionInterface) => {
  const caller = action.caller;
  const pools = state.pools;
  const input: DenyInterface = action.input;

  const denials = new Set(pools[input.id].denials);
  const registered = new Set(pools[input.id].registered);

  if (input.id >= pools.length || input.id < 0) {
    throw new ContractError(`Invalid pool id.`);
  }

  if (!registered.has(caller)) {
    throw new ContractError(`Caller not registered.`);
  }

  denials.add(caller);

  pools[input.id].denials = Array.from(denials);

  return { ...state, pools };
};
