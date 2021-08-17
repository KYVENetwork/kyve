import {
  CreditInterface,
  StateInterface,
  TransactionsFace,
} from "@kyve/contract-pool/dist/faces";
import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import { createContractFromTx, interactWrite, readContract } from "smartweave";
import { fetch } from "cross-fetch";
import {
  GOVERNANCE_CONTRACT_ID,
  POOL_SOURCE_CONTRACT_ID,
  TREASURY_CONTRACT_ID,
} from "./constants";

type Keyfile = JWKInterface | "use_wallet";

export class Pool {
  public client: Arweave;
  public wallet: Keyfile;
  public state?: StateInterface;
  public id?: string;

  private src = POOL_SOURCE_CONTRACT_ID;
  private governance = GOVERNANCE_CONTRACT_ID;
  private treasury = TREASURY_CONTRACT_ID;

  constructor(arweave: Arweave, wallet: Keyfile, id?: string) {
    this.client = arweave;
    this.wallet = wallet;
    this.id = id;
  }

  async create(state: StateInterface): Promise<string> {
    this.id = await createContractFromTx(
      this.client,
      this.wallet,
      this.src,
      JSON.stringify({
        ...state,
        settings: {
          ...state.settings,
          foriegnContracts: {
            governance: this.governance,
            treasury: this.treasury,
          },
        },
      })
    );
    return this.id!;
  }

  async getState(useCache: boolean = true): Promise<StateInterface> {
    if (!this.id) throw new Error("No pool ID specified.");

    let res: StateInterface;

    if (useCache) {
      const response = await fetch(
        `https://kyve.network/api/pool?id=${this.id}&type=meta`
      );
      if (response.ok) {
        res = await response.json();
      } else {
        throw new Error(`Couldn't read state for ${this.id} from cache.`);
      }
    } else {
      res = await readContract(this.client, this.id);
    }

    this.state = res;

    return res;
  }

  async getUnhandledTxs(
    address: string,
    useCache: boolean = true
  ): Promise<string[]> {
    if (!this.id) throw new Error("No pool ID specified.");

    let txs: TransactionsFace;

    if (useCache) {
      const response = await fetch(
        `https://kyve.network/api/pool?id=${this.id}&type=unhandledTxs`
      );
      if (response.ok) {
        txs = await response.json();
      } else {
        throw new Error(
          `Couldn't read unhandled txs for ${this.id} from cache.`
        );
      }
    } else {
      const state: StateInterface = await readContract(this.client, this.id);
      txs = state.txs;
    }

    const unhandledTxs = Object.entries(txs).filter(
      ([key, value]) =>
        value.status === "pending" && !value.voters.includes(address)
    );

    return unhandledTxs.map((tx) => tx[0]);
  }

  async processOutbox(): Promise<string> {
    return await this.interactWithGovernance({
      function: "readOutbox",
      contract: this.id!,
    });
  }

  async deposit(qty: number): Promise<string> {
    return await this.interactWithGovernance(
      {
        function: "transfer",
        target: this.id,
        qty,
      },
      [
        { name: "Contract", value: this.id! },
        { name: "Input", value: JSON.stringify({ function: "deposit" }) },
      ]
    );
  }

  async withdraw(qty: number): Promise<string> {
    const input: CreditInterface = {
      function: "withdraw",
      qty,
    };

    return await this.interactWithPool(input, [
      { name: "Contract", value: this.governance },
      {
        name: "Input",
        value: JSON.stringify({ function: "readOutbox", contract: this.id! }),
      },
    ]);
  }

  async fund(qty: number): Promise<string> {
    const input: CreditInterface = {
      function: "fund",
      qty,
    };

    return await this.interactWithPool(input);
  }

  async unfund(qty: number): Promise<string> {
    const input: CreditInterface = {
      function: "unfund",
      qty,
    };

    return await this.interactWithPool(input);
  }

  async stake(qty: number): Promise<string> {
    const input: CreditInterface = {
      function: "stake",
      qty,
    };

    return await this.interactWithPool(input);
  }

  async unstake(qty: number): Promise<string> {
    const input: CreditInterface = {
      function: "unstake",
      qty,
    };

    return await this.interactWithPool(input);
  }

  // === Private Functions ===

  private async interactWithGovernance(
    input: any,
    tags?: { name: string; value: string }[]
  ): Promise<string> {
    await this.getState();

    return await interactWrite(
      this.client,
      this.wallet,
      this.state!.settings.foreignContracts.governance,
      input,
      tags
    );
  }

  private async interactWithPool(
    input: any,
    tags?: { name: string; value: string }[]
  ): Promise<string> {
    await this.getState();

    return await interactWrite(this.client, this.wallet, this.id!, input, tags);
  }
}
