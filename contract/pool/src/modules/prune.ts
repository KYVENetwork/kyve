import { ActionInterface, StateInterface } from "../faces";

declare const SmartWeave: any;

export const Prune = async (
  state: StateInterface,
  action: ActionInterface
): Promise<StateInterface> => {
  let outbox = state.outbox;
  const settings = state.settings;

  const governanceState = await SmartWeave.contracts.readContractState(
    settings.foreignContracts.governance
  );
  const lastParsedTx =
    (governanceState.invocations[SmartWeave.contract.id] as string) || "";

  const index = outbox.findIndex((item) => item.txID === lastParsedTx);
  outbox = outbox.slice(index + 1);

  return { ...state, outbox };
};
