import {
  CreditInterface,
  StateInterface,
  SubmitInterface,
} from "@kyve/contract-pool/dist/faces";
import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import { createContractFromTx, interactWrite, readContract } from "smartweave";

type Keyfile = JWKInterface | "use_wallet";

export class Pool {
  public client: Arweave;
  public wallet: Keyfile;
  public state?: StateInterface;
  public id?: string;

  private src = "-GRxcV2BZT14lnUmoPyRE24KLU-ugN5afVUa-HUhgas";
  private governance = "cpXtKvM0e6cqAgjv-BCfanWQmYGupECt1MxRk1N9Mjk";
  private treasury = "shwdmXTFCaMq8WaCGg79oCF5GCj0bpb5tNA62cluEQY";

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
    return this.id;
  }

  async getState(): Promise<StateInterface> {
    if (!this.id) throw new Error("No pool ID specified.");
    const res = await readContract(this.client, this.id);
    this.state = res;

    return res;
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

  async fund(qty: number): Promise<string> {
    const input: CreditInterface = {
      function: "fund",
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
      this.state!.settings.foriegnContracts.governance,
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
