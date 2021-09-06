import { ActionInterface, StateInterface } from "./faces";
import { Fund } from "./modules/fund";
import { Prune } from "./modules/prune";
import { Register } from "./modules/register";
import { Stake } from "./modules/stake";
import { Submit } from "./modules/submit";
import { Unfund } from "./modules/unfund";
import { Unstake } from "./modules/unstake";
import { Update } from "./modules/update";
import { UpdateContracts } from "./modules/updateContracts";
import { Withdraw } from "./modules/withdraw";

export async function handle(state: StateInterface, action: ActionInterface) {
  // Pause the pool if we have more than 100 pending bundles.
  if (Object.keys(state.txs).length >= 100 * state.settings.bundleSize) {
    state.settings.paused = true;
  }

  // Clear the event log on each interaction.
  state.events = [];

  switch (action.input.function) {
    case "fund":
      return { state: await Fund(state, action) };
    case "unfund":
      return { state: Unfund(state, action) };
    case "stake":
      return { state: await Stake(state, action) };
    case "unstake":
      return { state: Unstake(state, action) };
    case "withdraw":
      return { state: Withdraw(state, action) };

    case "register":
      return { state: await Register(state, action) };
    case "submit":
      return { state: await Submit(state, action) };

    case "prune":
      return { state: await Prune(state, action) };

    case "update":
      return { state: Update(state, action) };
    case "updateContracts":
      return { state: UpdateContracts(state, action) };
  }
}
