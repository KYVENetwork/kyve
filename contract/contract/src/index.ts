import { ActionInterface, StateInterface } from "./faces";
import { CreatePool } from "./modules/createPool";
import { Dispense } from "./modules/dispense";
import { Finalize } from "./modules/finalize";
import { FundPool } from "./modules/fundPool";
import { Lock } from "./modules/lock";
import { Payout } from "./modules/payout";
import { Propose } from "./modules/propose";
import { Transfer } from "./modules/transfer";
import { Unlock } from "./modules/unlock";
import { Vote } from "./modules/vote";
import { Unregister } from "./modules/unregister";
import { Deny } from "./modules/deny";
import { Register } from "./modules/register";
import { Migrate } from "./modules/migrate";

declare const SmartWeave: any;
declare const ContractError: any;

export async function handle(state: StateInterface, action: ActionInterface) {
  if (state.migrated) {
    throw new ContractError("This contract has been migrated");
  }

  switch (action.input.function) {
    // Tokens
    case "dispense":
      return { state: Dispense(state, action) };
    case "transfer":
      return { state: Transfer(state, action) };
    case "lock":
      return { state: Lock(state, action) };
    case "unlock":
      return { state: Unlock(state, action) };

    // Pools
    case "createPool":
      return { state: CreatePool(state, action) };
    case "fund":
      return { state: FundPool(state, action) };

    // Voting
    case "propose":
      return { state: Propose(state, action) };
    case "vote":
      return { state: Vote(state, action) };
    case "finalize":
      return { state: Finalize(state, action) };

    // Node interactions
    case "register":
      return { state: Register(state, action) };
    case "unregister":
      return { state: Unregister(state, action) };
    case "deny":
      return { state: Deny(state, action) };
    case "payout":
      return { state: Payout(state, action) };

    // migration
    case "migrate":
      return { state: Migrate(state, action) };
  }
}
