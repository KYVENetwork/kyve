import { ActionInterface, StateInterface } from "../faces";
import Prando from "prando";

declare const ContractAssert: any;
declare const SmartWeave: any;

export const Submit = async (
  state: StateInterface,
  action: ActionInterface
) => {
  const credit = state.credit;
  const outbox = state.outbox;
  const settings = state.settings;
  const txs = state.txs;
  // Finds all addresses with stake in the pool
  const voters = Object.entries(credit)
    .filter(([key, value]) => value.stake && key !== settings.uploader)
    .map(([key, value]) => key);
  const caller = action.caller;

  ContractAssert(voters.includes(caller), "Caller has no stake in the pool.");

  const data: { txID: string; valid: boolean }[] = JSON.parse(
    await SmartWeave.unsafeClient.transactions.getData(
      SmartWeave.transaction.id,
      { decode: true, string: true }
    )
  );

  for (const { txID, valid } of data) {
    ContractAssert(
      !(txs[txID].yays.includes(caller) || txs[txID].nays.includes(caller)),
      "Caller has already voted."
    );

    ContractAssert(
      SmartWeave.block.height <=
        txs[txID].submittedAt + 2 * settings.gracePeriod,
      "Transaction has been dropped."
    );

    if (txs[txID].closesAt) {
      ContractAssert(
        SmartWeave.block.height <= txs[txID].closesAt,
        "Grace period has ended."
      );
    } else {
      txs[txID].closesAt = SmartWeave.block.height + settings.gracePeriod;
    }

    if (valid) txs[txID].yays.push(caller);
    else txs[txID].nays.push(caller);
    txs[txID].voters = voters;
  }

  // Finalize any previous transactions
  const unhandledTxs = Object.entries(txs)
    .sort((a, b) => a[1].closesAt - b[1].closesAt)
    .filter(
      ([key, value]) =>
        value.status === "pending" &&
        (SmartWeave.block.height > value.closesAt ||
          SmartWeave.block.height >
            value.submittedAt + 2 * settings.gracePeriod)
    );

  const weights = await WeightedBalances(settings.foriegnContracts.governance);

  for (const [txID, data] of unhandledTxs) {
    if (data.yays.length + data.nays.length > 0.5 * data.voters.length) {
      // Enough people voted
      const bytes = await GetBytes(txID);
      const tokens = Round(
        settings.payout.kyvePerByte * bytes + settings.payout.idleCost
      );
      // The pool does not have enough balance to perform payout
      if (
        tokens >
        Object.entries(credit)
          .map(([key, value]) => value.fund)
          .reduce((a, b) => a + b, 0)
      ) {
        settings.paused = true;
        continue;
      }
      let tempAmount = tokens;
      for (const address of Object.keys(credit)) {
        if (tempAmount <= credit[address].fund) {
          credit[address].fund -= tempAmount;
          break;
        } else {
          tempAmount -= credit[address].fund;
          credit[address].fund = 0;
        }
      }

      // Payout governance (1%)
      const governancePayout = Round(tokens * 0.01);
      const holder = RandomHolder(
        weights,
        txID,
        settings.foriegnContracts.treasury
      );
      outbox.push({
        txID: `${SmartWeave.transaction.id}//${outbox.length}`,
        invocation: {
          function: "transfer",
          target: holder,
          qty: governancePayout,
        },
      });

      // Payout treasury (1%)
      const treasuryPayout = Round(tokens * 0.01);
      outbox.push({
        txID: `${SmartWeave.transaction.id}//${outbox.length}`,
        invocation: {
          function: "transfer",
          target: settings.foriegnContracts.treasury,
          qty: treasuryPayout,
        },
      });

      // Payout uploader (68%)
      const uploaderPayout = Round(tokens * 0.68);
      credit[settings.uploader].amount += uploaderPayout;

      // Payout validators (30%)
      const validatorsPayout =
        tokens - governancePayout - treasuryPayout - uploaderPayout;
      for (const address of [...data.yays, ...data.nays]) {
        credit[address].amount += Round(
          validatorsPayout / (data.yays.length + data.nays.length)
        );
      }

      if (data.yays.length >= data.nays.length) {
        // Transaction is valid
        txs[txID].status = "valid";

        // Increase validator warnings
        for (const address of data.voters.filter(
          (item) => data.yays.indexOf(item) === -1
        )) {
          credit[address].points += 1;
        }
      } else {
        // Transaction is invalid
        txs[txID].status = "invalid";

        credit[settings.uploader].points += 1;
        // Increase validator warnings
        for (const address of data.voters.filter(
          (item) => data.nays.indexOf(item) === -1
        )) {
          credit[address].points += 1;
        }
      }
    } else {
      // Dropped (quorum failed)
      txs[txID].status = "dropped";
    }
    txs[txID].finalizedAt = SmartWeave.block.height;

    // TODO: Maybe come up with a better solution ...
    if (txs[txID].status === "valid") delete txs[txID];
  }

  // Handle slashing
  const unhandledSlashing = Object.entries(credit).filter(
    ([key, value]) => value.points > settings.slashThreshold
  );
  let totalSlashed = 0;

  for (const [address, data] of unhandledSlashing) {
    totalSlashed += credit[address].stake;
    credit[address].points = 0;
    credit[address].stake = 0;

    if (address === settings.uploader) {
      settings.uploader = "";
      settings.paused = true;
    }
  }

  if (totalSlashed) {
    outbox.push({
      txID: `${SmartWeave.transaction.id}//${outbox.length}`,
      invocation: {
        function: "transfer",
        target: settings.foriegnContracts.treasury,
        qty: totalSlashed,
      },
    });
  }

  return { ...state, credit, outbox, settings, txs };
};

const GetBytes = async (txID: string) => {
  const res = await SmartWeave.unsafeClient.api.post(
    "graphql",
    {
      query: `
      query($txID: ID!) {
        transactions(ids: [$txID]) {
          edges {
            node {
              data {
                size
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

  // Only return the data size
  return res.data.data.transactions.edges[0].node.data.size as number;
};

const Round = (input: number) => {
  return Math.floor(input * 10 ** 12) / 10 ** 12;
};

const WeightedBalances = async (governance: string) => {
  const state = await SmartWeave.contracts.readContractState(governance);

  const balances: { [address: string]: number } = {};
  const vault: {
    [address: string]: {
      balance: number;
      start: number;
      end: number;
    }[];
  } = state.vault;

  let totalTokens = 0;
  for (const addr of Object.keys(vault)) {
    if (!vault[addr].length) continue;

    const vaultBalance = vault[addr]
      .filter((item) => item.end > SmartWeave.block.height)
      .map((a) => a.balance)
      .reduce((a, b) => a + b, 0);

    totalTokens += vaultBalance;
    balances[addr] = vaultBalance;
  }

  const weighted: { [address: string]: number } = {};
  for (const addr of Object.keys(balances)) {
    weighted[addr] = balances[addr] / totalTokens;
  }

  return weighted;
};

const RandomHolder = (
  weights: { [address: string]: number },
  txID: string,
  treasury: string
) => {
  let sum = 0;
  const r = new Prando(txID).next();

  for (const key of Object.keys(weights)) {
    sum += weights[key];
    if (r <= sum && weights[key] > 0) {
      return key;
    }
  }

  // In the slim chance that no-one is selected, governance reward goes to treasury.
  return treasury;
};
