import { ActionInterface, RegisterInterface, StateInterface } from "../faces";

declare const ContractError: any;

export const Register = (state: StateInterface, action: ActionInterface) => {
  const caller = action.caller;
  const pools = state.pools;
  const input: RegisterInterface = action.input;

  const registered = new Set(pools[input.id].registered);

  if (input.id >= pools.length || input.id < 0) {
    throw new ContractError(`Invalid pool id.`);
  }

  if (!pools[input.id].vault[caller]) {
    throw new ContractError(
      `Caller has insufficient stake in pool: ${input.id}`
    );
  }

  registered.add(caller);

  pools[input.id].registered = Array.from(registered);

  return { ...state, pools };
};
