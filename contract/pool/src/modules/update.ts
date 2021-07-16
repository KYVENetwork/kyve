import { ActionInterface, StateInterface, UpdateInterface } from "../faces";

declare const ContractAssert: any;

export const Update = (state: StateInterface, action: ActionInterface) => {
  const caller = action.caller;

  const input: UpdateInterface = action.input;
  const settings = input.settings || state.settings;
  const config = input.config || state.config;

  ContractAssert(
    state.settings.admins.includes(caller),
    "Only admins can invoke this function."
  );

  return {
    ...state,
    settings,
    config,
  };
};
