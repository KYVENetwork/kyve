import { ActionInterface, MigrateInterface, StateInterface } from "../faces";

declare const ContractError: any;

export const Migrate = (state: StateInterface, action: ActionInterface) => {
  const caller = action.caller;
  const input: MigrateInterface = action.input;

  if (caller !== "cMM3SKregpSdGFhlMEEsU1nxeWFKAkKOCFaom4nKh7U") {
    throw new ContractError(`Caller is not allowed to migrate.`);
  }

  state.migrated = true;

  return { ...state };
};
