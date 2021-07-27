import { ActionInterface, StateInterface } from "../faces";
import { DataItemJson } from "arweave-bundles";
import { unbundleData } from "ans104";

declare const ContractAssert: any;
declare const SmartWeave: any;

export const Register = async (
  state: StateInterface,
  action: ActionInterface
) => {
  const txs = state.txs;
  const settings = state.settings;
  const caller = action.caller;

  ContractAssert(
    caller === settings.uploader,
    "Only the uploader can register data."
  );

  let ids: string[] = [];
  const tags = await GetTags(SmartWeave.transaction.id);

  if (
    tags.findIndex(
      (tag) => tag.name === "Bundle-Format" && tag.value === "json"
    ) > -1 &&
    tags.findIndex(
      (tag) => tag.name === "Bundle-Version" && tag.value === "1.0.0"
    ) > -1
  ) {
    // Transaction is an ANS-102 bundle
    const data = JSON.parse(
      await SmartWeave.unsafeClient.transactions.getData(
        SmartWeave.transaction.id,
        { decode: true, string: true }
      )
    );

    const items = data.items as DataItemJson[];
    items.forEach((item) => ids.push(item.id));
  } else if (
    tags.findIndex(
      (tag) => tag.name === "Bundle-Format" && tag.value === "binary"
    ) > -1 &&
    tags.findIndex(
      (tag) => tag.name === "Bundle-Version" && tag.value === "2.0.0"
    ) > -1
  ) {
    // Transaction is an ANS-104 bundle
    const data = await SmartWeave.unsafeClient.transactions.getData(
      SmartWeave.transaction.id
    );

    const bundle = unbundleData(data);
    ids = bundle.getIds();
  } else {
    // Transaction is not a bundle
    ids.push(SmartWeave.transaction.id);
  }

  for (const id of ids) {
    txs[id] = {
      status: "pending",
      submittedAt: SmartWeave.block.height,
      yays: [],
      nays: [],
      voters: [],
    };
  }

  return { ...state, txs };
};

const GetTags = async (txID: string) => {
  const res = await SmartWeave.unsafeClient.api.post(
    "graphql",
    {
      query: `
      query($txID: ID!) {
        transactions(ids: [$txID]) {
          edges {
            node {
              tags {
                name
                value
              }
            }
          }
        }
      }
  `,
      variables: { txID },
    },
    { headers: { "content-type": "application/json" } }
  );

  // Only return the tags
  return res.data.data.transactions.edges[0].node.tags as {
    name: string;
    value: string;
  }[];
};
