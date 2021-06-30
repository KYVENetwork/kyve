import { ActionInterface, StateInterface } from "./faces";
import { ReadOutbox } from "./modules/readOutbox";
import { Transfer } from "./modules/transfer";
import { Update } from "./modules/update";

export async function handle(state: StateInterface, action: ActionInterface) {
  switch (action.input.function) {
    case "readOutbox":
      return { state: ReadOutbox(state, action) };
    case "transfer":
      return { state: Transfer(state, action) };
    case "update":
      return { state: Update(state, action) };
  }
}
