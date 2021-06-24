import { ActionInterface, StateInterface } from "./faces";
import { Deposit } from "./modules/deposit";
import { Fund } from "./modules/fund";
import { Stake } from "./modules/stake";
import { Submit } from "./modules/submit";
import { Withdraw } from "./modules/withdraw";

export async function handle(state: StateInterface, action: ActionInterface) {
  switch (action.input.function) {
    case "deposit":
      return { state: await Deposit(state, action) };
    case "withdraw":
      return { state: Withdraw(state, action) };
    case "fund":
      return { state: Fund(state, action) };
    case "stake":
      return { state: Stake(state, action) };

    case "submit":
      return { state: await Submit(state, action) };
  }
}
