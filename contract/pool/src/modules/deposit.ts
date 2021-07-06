import { ActionInterface, StateInterface } from "../faces";

declare const ContractAssert: any;
declare const SmartWeave: any;

export const Deposit = async (
  state: StateInterface,
  action: ActionInterface
) => {
  const credit = state.credit;
  const settings = state.settings;
  const caller = action.caller;

  const tags: { name: string; value: string }[] = SmartWeave.transaction.tags;
  const index = tags.findIndex(
    (tag) =>
      tag.name === "Contract" &&
      tag.value === settings.foriegnContracts.governance
  );
  ContractAssert(
    index !== -1,
    "No interaction with governance contract found."
  );

  const input = JSON.parse(tags[index + 1].value);
  ContractAssert(
    input.function === "transfer" && input.target === SmartWeave.contract.id,
    "Invalid interaction with governance contract."
  );
  const validity = (
    await SmartWeave.contracts.readContractState(
      settings.foriegnContracts.governance,
      undefined,
      true
    )
  ).validity;
  ContractAssert(
    validity[SmartWeave.transaction.id],
    "Invalid interaction with governance contract."
  );

  if (caller in credit) {
    credit[caller].amount += input.qty;
  } else {
    credit[caller] = {
      amount: input.qty,
      stake: 0,
      fund: 0,
      points: 0,
    };
  }

  return { ...state, credit };
};
