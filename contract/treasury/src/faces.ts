export interface StateInterface {
  governanceContract: string;

  invocations: string[];
  foreignCalls: { txID: string; contract: string; input: any }[];
}

export interface ActionInterface {
  input: any;
  caller: string;
}

// Module Interfaces

export interface UpdateInterface {
  function: "update";
  newID: string;
}

export interface ReadOutboxInterface {
  function: "readOutbox";
}

export interface TransferInterface {
  function: "transfer";
  target: string;
  qty: number;
}
