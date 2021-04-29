export interface StateInterface {
  name: string;
  ticker: string;
  migrated: boolean;
  balances: {
    [address: string]: number;
  };
  vault: {
    [address: string]: number;
  };
  pools: {
    name: string;
    architecture: string;
    config: Object;

    balance: number;
    vault: { [address: string]: number };
    rates: {
      uploader: number;
      validator: number;
    };

    bundleSize: number;

    uploader?: string;
    registered: string[];
    denials: string[];
    lastPayout: number;
  }[];
  votes: {
    status: "pending" | "passed" | "failed";
    start: number;
    end: number;
    type: "mint" | "burn" | "updatePool";
    yays: string[];
    nays: string[];
    metadata: {
      target?: number;
      qty?: number;

      id?: number;
      pool?: {
        name?: string;
        config?: Object;
        uploader?: string;
        rates?: {
          uploader?: number;
          validator?: number;
        };
        bundleSize?: number;
      };
    };
  }[];
}

export interface ActionInterface {
  input: any;
  caller: string;
}

//

export interface DispenseInterface {
  function: "dispense";
}

export interface TransferInterface {
  function: "transfer";
  target: string;
  qty: number;
}

export interface LockInterface {
  function: "lock";
  id?: number;
  qty: number;
}

export interface UnlockInterface {
  function: "unlock";
  id?: number;
}

export interface CreatePoolInterface {
  function: "createPool";
  name: string;
  architecture: string;
  config: Object;
}

export interface FundPoolInterface {
  function: "fund";
  id: number;
  qty: number;
}

export interface ProposeInterface {
  function: "propose";
  type: "mint" | "burn" | "updatePool";
  target?: number;
  qty?: number;

  id?: number;
  pool?: {
    name?: string;
    config?: Object;
    uploader?: string;
    rates?: {
      uploader?: number;
      validator?: number;
    };
    bundleSize?: number;
  };
}

export interface VoteInterface {
  function: "vote";
  id: number;
  cast: "yay" | "nay";
}

export interface FinalizeInterface {
  function: "finalize";
  id: number;
}

export interface RegisterInterface {
  function: "register";
  id: number;
}

export interface UnregisterInterface {
  function: "unregister";
  id: number;
}

export interface DenyInterface {
  function: "deny";
  id: number;
}

export interface PayoutInterface {
  function: "payout";
  id: number;
}

export interface MigrateInterface {
  function: "migrate";
}
