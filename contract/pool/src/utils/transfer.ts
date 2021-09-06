import { StateInterface } from "../faces";

declare const ContractAssert: any;
declare const SmartWeave: any;

export const GetTransferAmount = async (
  state: StateInterface
): Promise<number> => {
  const settings = state.settings;

  const tags: { name: string; value: string }[] = SmartWeave.transaction.tags;
  const index = tags.findIndex(
    (tag) =>
      tag.name === "Contract" &&
      tag.value === settings.foreignContracts.governance
  );
  ContractAssert(
    index !== -1,
    "No interaction with governance contract found."
  );

  const input = JSON.parse(tags[index + 1].value);
  ContractAssert(
    input.function === "transfer" && input.target === SmartWeave.contract.id,
    "Caller did not transfer funds to the current contract."
  );
  const validity = (
    await SmartWeave.contracts.readContractState(
      settings.foreignContracts.governance,
      undefined,
      true
    )
  ).validity;
  ContractAssert(
    validity[SmartWeave.transaction.id],
    "Interaction on the governance contract resulted in an error."
  );

  return input.qty;
};
