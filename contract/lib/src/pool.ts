import {
  CreditInterface,
  StateInterface,
  SubmitInterface,
} from "@kyve/contract-pool/dist/faces";
import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import { interactWrite, readContract } from "smartweave";

type Keyfile = JWKInterface | "use_wallet";

export class Pool {
  public client: Arweave;
  public wallet: Keyfile;
  public state?: StateInterface;
  public id?: string;

  constructor(arweave: Arweave, wallet: Keyfile, id?: string) {
    this.client = arweave;
    this.wallet = wallet;
    this.id = id;
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
