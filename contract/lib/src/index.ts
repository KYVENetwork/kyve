// TODO: Why imported from /dist/...
import {
  CreatePoolInterface,
  DenyInterface,
  DispenseInterface,
  FinalizeInterface,
  FundPoolInterface,
  LockInterface,
  PayoutInterface,
  ProposeInterface,
  RegisterInterface,
  StateInterface,
  TransferInterface,
  UnlockInterface,
  UnregisterInterface,
  VoteInterface,
} from "@kyve/contract/dist/faces";
import { interactWrite, readContract } from "smartweave";
import Arweave from "arweave";
import { JWKInterface } from "arweave/web/lib/wallet";

type Keyfile = JWKInterface | "use_wallet" | undefined;

class Contract {
  public arweave: Arweave;
  public keyfile: Keyfile;
  // Todo import from @kyve/contract
  public ID: string = "-NpR1D0UzGTNuLzG4XN4ZfKKnVOceHMpiDvtHBJ3MXo";

  constructor(arweave: Arweave, keyfile?: Keyfile) {
    this.arweave = arweave;
    this.keyfile = keyfile;
  }

  getState = async (): Promise<StateInterface> => {
    return await readContract(this.arweave, this.ID);
  };

  write = async (input: any): Promise<string> => {
    //@ts-ignore
    return await interactWrite(this.arweave, this.keyfile, this.ID, input);
  };

  register = async (poolID: number): Promise<string> => {
    const input: RegisterInterface = {
      function: "register",
      id: poolID,
    };
    return await this.write(input);
  };

  unregister = async (poolID: number): Promise<string> => {
    const input: UnregisterInterface = {
      function: "unregister",
      id: poolID,
    };
    return await this.write(input);
  };

  lock = async (poolID: number, qty: number): Promise<string> => {
    const input: LockInterface = {
      function: "lock",
      id: poolID,
      qty: qty,
    };
    return await this.write(input);
  };

  lockGlobal = async (qty: number): Promise<string> => {
    const input: LockInterface = {
      function: "lock",
      qty: qty,
    };
    return await this.write(input);
  };

  unlock = async (poolID: number): Promise<string> => {
    const input: UnlockInterface = {
      function: "unlock",
      id: poolID,
    };
    return await this.write(input);
  };

  deny = async (poolID: number): Promise<string> => {
    const input: DenyInterface = {
      function: "deny",
      id: poolID,
    };
    return await this.write(input);
  };

  createPool = async (
    poolName: string,
    architecture: string,
    config: Object
  ): Promise<string> => {
    const input: CreatePoolInterface = {
      function: "createPool",
      name: poolName,
      architecture: architecture,
      config: config,
    };
    return await this.write(input);
  };

  fundPool = async (poolID: number, quantity: number): Promise<string> => {
    const input: FundPoolInterface = {
      function: "fund",
      id: poolID,
      qty: quantity,
    };
    return await this.write(input);
  };

  // todo add pool type
  updatePool = async (poolID: number, pool: any): Promise<string> => {
    const input: ProposeInterface = {
      function: "propose",
      type: "updatePool",
      id: poolID,
      pool: pool,
    };
    return await this.write(input);
  };

  vote = async (voteID: number, cast: "yay" | "nay"): Promise<string> => {
    const input: VoteInterface = {
      function: "vote",
      id: voteID,
      cast,
    };
    return await this.write(input);
  };

  finalize = async (voteID: number): Promise<string> => {
    const input: FinalizeInterface = {
      function: "finalize",
      id: voteID,
    };
    return await this.write(input);
  };

  transfer = async (target: string, quantity: number): Promise<string> => {
    const input: TransferInterface = {
      function: "transfer",
      target: target,
      qty: quantity,
    };
    return await this.write(input);
  };

  dispense = async (): Promise<string> => {
    const input: DispenseInterface = {
      function: "dispense",
    };
    return await this.write(input);
  };

  payout = async (poolID: number): Promise<string> => {
    const input: PayoutInterface = {
      function: "payout",
      id: poolID,
    };
    return await this.write(input);
  };
}

export default Contract;
