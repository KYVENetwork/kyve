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
  public inst: Arweave;
  public wallet: Keyfile;
  public state?: StateInterface;
  public id?: string;
  public useCache: boolean;
  public cacheUrl: string = "https://api.kyve.network";

  private src = POOL_SOURCE_CONTRACT_ID;
  private governance = GOVERNANCE_CONTRACT_ID;
  private treasury = TREASURY_CONTRACT_ID;

  constructor(
    arweave: Arweave,
    wallet: Keyfile,
    id?: string,
    useCache: boolean = true
  ) {
    this.inst = arweave;
    this.wallet = wallet;
    this.id = id;
    this.useCache = useCache;
  }

  async create(state: StateInterface): Promise<string> {
    this.id = await createContractFromTx(
      this.inst,
      this.wallet,
      this.src,
      JSON.stringify({
        ...state,
        settings: {
          ...state.settings,
          foreignContracts: {
            governance: this.governance,
            treasury: this.treasury,
          },
        },
      })
    );
    return this.id!;
  }

  async getState(): Promise<StateInterface> {
    if (!this.id) throw new Error("No pool ID specified.");

    let res: StateInterface;

    if (this.useCache) {
      const response = await fetch(
        `${this.cacheUrl}/pool?id=${this.id}&type=meta`
      );
      if (response.ok) {
        res = await response.json();
      } else {
        throw new Error(`Couldn't read state for ${this.id} from cache.`);
      }
    } else {
      res = await readContract(this.inst, this.id);
    }

    this.state = res;

    return res;
  }

  async getUnhandledTxs(address: string): Promise<string[]> {
    if (!this.id) throw new Error("No pool ID specified.");

    let txs: TransactionsFace;

    if (this.useCache) {
      const response = await fetch(
        `${this.cacheUrl}/pool?id=${this.id}&type=unhandledTxs`
      );
      if (response.ok) {
        txs = await response.json();
      } else {
        throw new Error(
          `Couldn't read unhandled txs for ${this.id} from cache.`
        );
      }
    } else {
      const state: StateInterface = await readContract(this.inst, this.id);
      txs = state.txs;
    }

    const unhandledTxs = Object.entries(txs).filter(
      ([key, value]) =>
        !(value.yays.includes(address) || value.nays.includes(address))
    );

    return unhandledTxs.map((tx) => tx[0]);
  }

  async processOutbox(): Promise<string> {
    return await this.interactWithGovernance({
      function: "readOutbox",
      contract: this.id!,
    });
  }

  async fund(qty: number): Promise<string> {
    return await this.interactWithGovernance(
      {
        function: "transfer",
        target: this.id,
        qty,
      },
      [
        { name: "Contract", value: this.id! },
        { name: "Input", value: JSON.stringify({ function: "fund" }) },
      ]
    );
  }

  async unfund(qty: number): Promise<string> {
    const input: CreditInterface = {
      function: "unfund",
      qty,
    };

    return await this.interactWithPool(input);
  }

  async stake(qty: number): Promise<string> {
    return await this.interactWithGovernance(
      {
        function: "transfer",
        target: this.id,
        qty,
      },
      [
        { name: "Contract", value: this.id! },
        { name: "Input", value: JSON.stringify({ function: "stake" }) },
      ]
    );
  }

  async unstake(qty: number): Promise<string> {
    const input: CreditInterface = {
      function: "unstake",
      qty,
    };

    return await this.interactWithPool(input);
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

  // === Private Functions ===

  private async interactWithGovernance(
    input: any,
    tags?: { name: string; value: string }[]
  ): Promise<string> {
    await this.getState();

    const transaction = await this.inst.createTransaction({
      data: Math.random().toString().slice(-4),
    });

    transaction.addTag("App-Name", "SmartWeaveAction");
    transaction.addTag("App-Version", "0.3.0");
    transaction.addTag(
      "Contract",
      this.state!.settings.foreignContracts.governance
    );
    transaction.addTag("Input", JSON.stringify(input));
    if (tags) {
      tags.forEach((tag) => transaction.addTag(tag.name, tag.value));
    }

    // Bump the reward for higher chance of mining.
    transaction.reward = (+transaction.reward * 2).toString();

    await this.inst.transactions.sign(transaction, this.wallet);
    await this.inst.transactions.post(transaction);

    return transaction.id;
  }

  private async interactWithPool(
    input: any,
    tags?: { name: string; value: string }[]
  ): Promise<string> {
    await this.getState();

    const transaction = await this.inst.createTransaction({
      data: Math.random().toString().slice(-4),
    });

    transaction.addTag("App-Name", "SmartWeaveAction");
    transaction.addTag("App-Version", "0.3.0");
    transaction.addTag("Contract", this.id!);
    transaction.addTag("Input", JSON.stringify(input));
    if (tags) {
      tags.forEach((tag) => transaction.addTag(tag.name, tag.value));
    }

    // Bump the reward for higher chance of mining.
    transaction.reward = (+transaction.reward * 2).toString();

    await this.inst.transactions.sign(transaction, this.wallet);
    await this.inst.transactions.post(transaction);

    return transaction.id;
  }
}
