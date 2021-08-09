import { ActionInterface, StateInterface } from "../faces";

declare const SmartWeave: any;

export const Prune = async (
  state: StateInterface,
  action: ActionInterface
): Promise<StateInterface> => {
  const foreignCalls = state.foreignCalls;

  for (const contract of Object.keys(foreignCalls)) {
    const foreignState = await SmartWeave.contracts.readContractState(contract);
    const lastParsedTx = foreignState.lastParsedTx as string;

    const index = foreignCalls[contract].findIndex(
      (item) => item.txID === lastParsedTx
    );
    foreignCalls[contract] = foreignCalls[contract].slice(index + 1);
  }

  return { ...state, foreignCalls };
};
