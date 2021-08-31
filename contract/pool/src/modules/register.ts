import { ActionInterface, StateInterface } from "../faces";
import { DataItemJson } from "arweave-bundles";

declare const ContractAssert: any;
declare const SmartWeave: any;

export const Register = async (
  state: StateInterface,
  action: ActionInterface
) => {
  const txs = state.txs;
  const settings = state.settings;
  const caller = action.caller;

  ContractAssert(!settings.paused, "Pool is currently paused.");
  ContractAssert(
    caller === settings.uploader,
    "Only the uploader can register data."
  );

  const ids: { id: string; bundle: boolean }[] = [];
  const tags: { name: string; value: string }[] = SmartWeave.transaction.tags;

  if (
    tags.findIndex(
      (tag) => tag.name === "Bundle-Format" && tag.value === "json"
    ) > -1 &&
    tags.findIndex(
      (tag) => tag.name === "Bundle-Version" && tag.value === "1.0.0"
    ) > -1
  ) {
    // Transaction is a bundle
    const data = JSON.parse(
      await SmartWeave.unsafeClient.transactions.getData(
        SmartWeave.transaction.id,
        { decode: true, string: true }
      )
    );

    const items = data.items as DataItemJson[];
    items.forEach((item) => ids.push({ id: item.id, bundle: true }));
  } else {
    // Transaction is not a bundle
    ids.push({ id: SmartWeave.transaction.id, bundle: false });
  }

  for (const { id, bundle } of ids) {
    txs[id] = {
      submittedAt: SmartWeave.block.height,
      yays: [],
      nays: [],
      voters: [],
      bundle,
    };
  }

  return { ...state, txs };
};
