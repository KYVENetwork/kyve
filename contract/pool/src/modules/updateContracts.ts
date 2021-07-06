import {
  ActionInterface,
  StateInterface,
  UpdateContractsInterface,
} from "../faces";

declare const ContractAssert: any;

export const UpdateContracts = (
  state: StateInterface,
  action: ActionInterface
) => {
  const contracts = state.settings.foriegnContracts;
  const caller = action.caller;

  const input: UpdateContractsInterface = action.input;
  const governance = input.governance;
  const treasury = input.treasury;

  ContractAssert(
    caller === contracts.governance,
    "Only the governance can invoke this function."
  );

  if (governance) contracts.governance = governance;
  if (treasury) contracts.treasury = treasury;

  return {
    ...state,
    settings: { ...state.settings, foriegnContracts: contracts },
  };
};
