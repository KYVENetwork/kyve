import { ActionInterface, StateInterface } from "../faces";
import { handle } from "../index";

declare const SmartWeave: any;

export const ReadOutbox = async (
  state: StateInterface,
  action: ActionInterface
): Promise<StateInterface> => {
  const governance = state.governanceContract;
  const invocations = state.invocations;

  const foreignState = await SmartWeave.contracts.readContractState(governance);
  const unhandledCalls = foreignState.foreignCalls.filter(
    (entry) =>
      entry.contract === SmartWeave.contract.id &&
      !invocations.includes(entry.txID)
  );

  for (const call of unhandledCalls) {
    let res: any;
    try {
      res = await handle(state, {
        caller: governance,
        input: call.input,
      });
    } catch {}

    if (res) state = res.state;
    state.invocations.push(call.txID);
  }

  return state;
};
