export interface StateInterface {
  settings: SettingsInterface;
  config: any;

  credit: {
    [address: string]: {
      amount: number;
      stake: number;
      fund: number;
      points: number;
    };
  };

  txs: TransactionsFace;

  invocations: string[];
  foreignCalls: { [contract: string]: { txID: string; invocation: string }[] };
}

export interface SettingsInterface {
  name: string;
  runtime: string; // e.g. "@kyve/smartweave"
  version: string;
  logo: string;
  foriegnContracts: {
    governance: string;
    treasury: string;
  };
  paused: boolean;
  admins: string[];

  uploader: string;
  bundleSize: number; // 1

  gracePeriod: number; // 20
  slashThreshold: number; // 5
  payout: {
    kyvePerByte: number; // 1
    idleCost: number; // 0
  };
}

export interface TransactionsFace {
  [id: string]: {
    status: "pending" | "dropped" | "valid" | "invalid";
    submittedAt: number;
    closesAt?: number;
    finalizedAt?: number;

    yays: string[];
    nays: string[];
    voters: string[];
  };
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

export interface RegisterInterface {
  // can only be called by the current uploader
  function: "register";
}

export interface SubmitInterface {
  function: "submit";
}

export interface PruneInterface {
  function: "prune";
}

export interface UpdateInterface {
  // can only be called by the pool owner
  function: "update";
  settings?: SettingsInterface;
  config?: any;
}

export interface UpdateContractsInterface {
  // can only be called by the current governance contract
  function: "updateContracts";
  governance?: string;
  treasury?: string;
}
