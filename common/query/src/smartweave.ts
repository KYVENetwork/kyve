import Arweave from "arweave";
import { Query } from "./index";
import { getData } from "@kyve/core";
import { arweaveClient } from "@kyve/core/dist/extensions";
import ArDB from "ardb";
import { ContractInteraction, execute } from "smartweave/lib/contract-step";
import { InteractionTx } from "smartweave/lib/interaction-tx";
import { arrayToHex, formatTags } from "smartweave/lib/utils";
import { GQLEdgeTransactionInterface } from "ardb/lib/faces/gql";
import { loadContract } from "smartweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import { BlockData } from "arweave/node/blocks";
import Transaction from "arweave/node/lib/transaction";
import { CreateTransactionInterface } from "arweave/node/common";

export const readContract = async (
  poolID: string,
  contractID: string,
  returnValidity: boolean,
  arweave: Arweave = arweaveClient
) => {
  // load last KYVE state for this contract
  const query = new Query(poolID, false, arweave);

  const result = await query
    .tag("Target-Contract", contractID)
    .only(["id", "tags", "tags.name", "tags.value"])
    .limit(1)
    .find();

  if (!result) {
    throw new Error("No matching transactions in pool found.");
  }

  const transaction = result[0];

  // find 'Block' tag
  const latestArchivedBlock = parseInt(
    transaction.tags.find(
      (tag: { name: string; value: string }) => tag.name == "Block"
    ).value
  );

  const data: { state: object } = JSON.parse(await getData(transaction.id));
  let state = data.state;

  // find txs which have not been added to state

  // get latest network height
  const networkInfo = await arweave.network.getInfo();
  const height = networkInfo.height;

  const ardb = new ArDB(arweave);
  const missingTXs = (await ardb
    .sort("HEIGHT_ASC")
    .min(latestArchivedBlock + 1)
    .max(height)
    .tags([
      { name: "App-Name", values: ["SmartWeaveAction"] },
      { name: "Contract", values: [contractID] },
    ])
    .findAll()) as GQLEdgeTransactionInterface[];

  // from https://github.com/ArweaveTeam/SmartWeave/blob/master/src/contract-read.ts#L56
  // TODO: FIX ONCE https://github.com/ArweaveTeam/SmartWeave/pull/82 is merged

  await sortTransactions(arweave, missingTXs);

  const contractInfo = await loadContract(arweave, contractID);
  const { handler, swGlobal } = contractInfo;

  const validity: Record<string, boolean> = {};

  for (const txInfo of missingTXs) {
    const tags = formatTags(txInfo.node.tags);

    const currentTx: InteractionTx = {
      ...txInfo.node,
      tags,
    };

    let input = currentTx.tags.Input;

    // Check that input is not an array. If a tx has multiple input tags, it will be an array
    if (Array.isArray(input)) {
      console.warn(`Skipping tx with multiple Input tags - ${currentTx.id}`);
      continue;
    }

    try {
      input = JSON.parse(input);
    } catch (e) {
      console.log(e);
      continue;
    }

    if (!input) {
      console.log(
        `Skipping tx with missing or invalid Input tag - ${currentTx.id}`
      );
      continue;
    }

    const interaction: ContractInteraction = {
      input,
      caller: currentTx.owner.address,
    };

    swGlobal._activeTx = currentTx;

    const result = await execute(handler, interaction, state);

    if (result.type === "exception") {
      console.warn(
        `Executing of interaction: ${currentTx.id} threw exception.`
      );
      console.warn(`${result.result}`);
    }
    if (result.type === "error") {
      console.warn(`Executing of interaction: ${currentTx.id} returned error.`);
      console.warn(`${result.result}`);
    }

    validity[currentTx.id] = result.type === "ok";

    state = result.state;
  }

  return returnValidity ? { state, validity } : state;
};

export const interactRead = async (
  poolID: string,
  contractID: string,
  input: any,
  wallet: JWKInterface | "use_wallet" | undefined,
  tags: { name: string; value: string }[] = [],
  target: string = "",
  winstonQty: string = "",
  arweave: Arweave = arweaveClient
) => {
  const latestState = await readContract(poolID, contractID, false, arweave);
  const { handler, swGlobal } = await loadContract(arweave, contractID);
  const from = wallet ? await arweave.wallets.getAddress(wallet) : "";

  const interaction: ContractInteraction = {
    input,
    caller: from,
  };

  const tx = await createTx(
    arweave,
    wallet,
    contractID,
    input,
    tags,
    target,
    winstonQty
  );
  const currentBlock: BlockData = await arweave.blocks.getCurrent();

  // @ts-ignore
  swGlobal._activeTx = createDummyTx(tx, from, currentBlock);

  const result = await execute(handler, interaction, latestState);

  return result.result;
};

// Sort the transactions based on the sort key generated in addSortKey()
async function sortTransactions(arweave: Arweave, txInfos: any[]) {
  const addKeysFuncs = txInfos.map((tx) => addSortKey(arweave, tx));
  await Promise.all(addKeysFuncs);

  txInfos.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

// Construct a string that will lexographically sort.
// { block_height, sha256(block_indep_hash + txid) }
// pad block height to 12 digits and convert hash value
// to a hex string.
async function addSortKey(arweave: Arweave, txInfo: any) {
  const { node } = txInfo;

  const blockHashBytes = arweave.utils.b64UrlToBuffer(node.block.id);
  const txIdBytes = arweave.utils.b64UrlToBuffer(node.id);
  const concatted = arweave.utils.concatBuffers([blockHashBytes, txIdBytes]);
  const hashed = arrayToHex(await arweave.crypto.hash(concatted));
  const blockHeight = `000000${node.block.height}`.slice(-12);

  txInfo.sortKey = `${blockHeight},${hashed}`;
}

async function createTx(
  arweave: Arweave,
  wallet: JWKInterface | "use_wallet" | undefined,
  contractId: string,
  input: any,
  tags: { name: string; value: string }[],
  target: string = "",
  winstonQty: string = "0"
): Promise<Transaction> {
  const options: Partial<CreateTransactionInterface> = {
    data: Math.random().toString().slice(-4),
  };

  if (target && target.length) {
    options.target = target.toString();
    if (winstonQty && +winstonQty > 0) {
      options.quantity = winstonQty.toString();
    }
  }

  const interactionTx = await arweave.createTransaction(options, wallet);

  if (!input) {
    throw new Error(`Input should be a truthy value: ${JSON.stringify(input)}`);
  }

  if (tags && tags.length) {
    for (const tag of tags) {
      interactionTx.addTag(tag.name.toString(), tag.value.toString());
    }
  }
  interactionTx.addTag("App-Name", "SmartWeaveAction");
  interactionTx.addTag("App-Version", "0.3.0");
  interactionTx.addTag("Contract", contractId);
  interactionTx.addTag("Input", JSON.stringify(input));

  await arweave.transactions.sign(interactionTx, wallet);
  return interactionTx;
}

function createDummyTx(tx: Transaction, from: string, block: BlockData) {
  return {
    id: tx.id,
    owner: {
      address: from,
    },
    recipient: tx.target,
    tags: tx.tags,
    fee: {
      winston: tx.reward,
    },
    quantity: {
      winston: tx.quantity,
    },
    block: {
      id: block.indep_hash,
      height: block.height,
      timestamp: block.timestamp,
    },
  };
}
