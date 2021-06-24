export interface StateInterface {
  settings: {
    // TODO: Handle metanode architecture
    name: string;
    logo: string;
    foriegnContracts: {
      governance: string;
      treasury: string;
    };

    uploader: string;
    bundleSize: number; // 1

    gracePeriod: number; // 20
    slashThreshold: number; // 5
    payout: {
      kyvePerByte: number; // 1
      idleCost: number; // 0
    };
  };
  config: any;

  credit: {
    [address: string]: {
      amount: number;
      stake: number;
      fund: number;
      points: number;
    };
  };

  txs: {
    [id: string]: {
      status: "pending" | "dropped" | "valid" | "invalid";
      closesAt: number;
      confirmedAt?: number;

      yays: string[];
      nays: string[];
      voters: string[];
    };
  };

  // TODO: Voting

  invocations: string[];
  foreignCalls: { txID: string; contract: string; input: any }[];
}

export interface ActionInterface {
  input: any;
  caller: string;
}

// Module Interfaces

export interface CreditInterface {
  function: "deposit" | "withdraw" | "fund" | "unfund" | "stake" | "unstake";
  // deposit and unstake don't require qty
  qty?: number;
}

export interface SubmitInterface {
  function: "submit";
  txID: string;
  valid: boolean;
}

export interface UpdateContractsInterface {
  // can only be called by the current governance contract
  function: "updateContracts";
  governance?: string;
  treasury?: string;
}
