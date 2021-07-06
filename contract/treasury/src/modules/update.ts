import { ActionInterface, StateInterface, UpdateInterface } from "../faces";

declare const ContractAssert: any;

export const Update = (
  state: StateInterface,
  action: ActionInterface
): StateInterface => {
  const governance = state.governanceContract;
  const caller = action.caller;

  const input: UpdateInterface = action.input;

  ContractAssert(
    caller === governance,
    "Only the governance can invoke this function."
  );

  return { ...state, governanceContract: input.newID };
};
