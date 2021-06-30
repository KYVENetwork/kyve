import { ActionInterface, StateInterface } from "../faces";

declare const ContractAssert: any;
declare const SmartWeave: any;

export const Transfer = (
  state: StateInterface,
  action: ActionInterface
): StateInterface => {
  const governance = state.governanceContract;
  const foreignCalls = state.foreignCalls;
  const caller = action.caller;

  ContractAssert(
    caller === governance,
    "Only the governance can invoke this function."
  );

  foreignCalls.push({
    txID: SmartWeave.transaction.id,
    contract: governance,
    input: action.input,
  });

  return { ...state, foreignCalls };
};
