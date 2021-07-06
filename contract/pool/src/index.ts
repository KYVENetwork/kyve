import { ActionInterface, StateInterface } from "./faces";
import { Deposit } from "./modules/deposit";
import { Fund } from "./modules/fund";
import { Register } from "./modules/register";
import { Stake } from "./modules/stake";
import { Submit } from "./modules/submit";
import { Unfund } from "./modules/unfund";
import { Unstake } from "./modules/unstake";
import { Update } from "./modules/update";
import { UpdateContracts } from "./modules/updateContracts";
import { Withdraw } from "./modules/withdraw";

export async function handle(state: StateInterface, action: ActionInterface) {
  switch (action.input.function) {
    case "deposit":
      return { state: await Deposit(state, action) };
    case "withdraw":
      return { state: Withdraw(state, action) };
    case "fund":
      return { state: Fund(state, action) };
    case "unfund":
      return { state: Unfund(state, action) };
    case "stake":
      return { state: Stake(state, action) };
    case "unstake":
      return { state: Unstake(state, action) };

    case "register":
      return { state: await Register(state, action) };
    case "submit":
      return { state: await Submit(state, action) };

    case "update":
      return { state: Update(state, action) };
    case "updateContracts":
      return { state: UpdateContracts(state, action) };
  }
}
