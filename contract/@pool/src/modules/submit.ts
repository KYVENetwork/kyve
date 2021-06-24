import { ActionInterface, StateInterface, SubmitInterface } from "../faces";

declare const ContractAssert: any;
declare const SmartWeave: any;

export const Submit = async (
  state: StateInterface,
  action: ActionInterface
) => {
  const credit = state.credit;
  const txs = state.txs;
  const settings = state.settings;
  // Finds all addresses with stake in the pool
  const voters = Object.entries(credit)
    .filter(([key, value]) => value.stake && key !== settings.uploader)
    .map(([key, value]) => key);
  const caller = action.caller;

  const input: SubmitInterface = action.input;
  const txID = input.txID;
  const valid = input.valid;

  ContractAssert(voters.includes(caller), "Caller has no stake in the pool.");

  if (txID in txs) {
    ContractAssert(
      SmartWeave.block.height <= txs[txID].closesAt,
      "Grace period has ended."
    );
    ContractAssert(
      !(txs[txID].yays.includes(caller) || txs[txID].nays.includes(caller)),
      "Caller has already voted."
    );

    if (valid) txs[txID].yays.push(caller);
    else txs[txID].nays.push(caller);
    txs[txID].voters = voters;
  } else {
    txs[txID] = {
      status: "pending",
      closesAt: SmartWeave.block.height + settings.gracePeriod,

      yays: valid ? [caller] : [],
      nays: valid ? [] : [caller],
      voters,
    };
  }

  // Finalize any previous transactions
  const unhandledTxs = Object.entries(txs).filter(
    ([key, value]) =>
      value.status === "pending" && SmartWeave.block.height > value.closesAt
  );

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
        // TODO: Pause pool
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

      // TODO: Payout governance (1%)
      const governancePayout = Round(tokens * 0.01);

      // TODO: Payout treasury (1%)
      const treasuryPayout = Round(tokens * 0.01);

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
    txs[txID].confirmedAt = SmartWeave.block.height;
  }

  // Handle slashing
  const unhandledSlashing = Object.entries(credit).filter(
    ([key, value]) => value.points > settings.slashThreshold
  );

  for (const [address, data] of unhandledSlashing) {
    // TODO: Payout treasury
    credit[address].points = 0;
    credit[address].stake = 0;

    if (address === settings.uploader) {
      settings.uploader = "";
      // TODO: Pause pool
    }
  }

  return { ...state, credit, txs, settings };
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
