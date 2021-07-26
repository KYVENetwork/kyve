import { ActionInterface, EvolveInterface, StateInterface } from "../faces";

declare const ContractAssert: any;

export const Evolve = (
  state: StateInterface,
  action: ActionInterface
): StateInterface => {
  const caller = action.caller;

  const input: EvolveInterface = action.input;
  const source = input.source;

  ContractAssert(
    state.settings.admins.includes(caller),
    "Only admins can invoke this function."
  );

  return {
    ...state,
    _evolvedTo: source,
  };
};
