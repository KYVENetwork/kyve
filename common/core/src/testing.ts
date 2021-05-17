import KYVE from "./index";
import { UploadFunction, ValidateFunction } from "./faces";
import { JWKInterface } from "arweave/node/lib/wallet";
import Arweave from "arweave";

class TestInstance extends KYVE {
  constructor(
    options: {
      // todo add pool face
      pool: any;
      jwk: JWKInterface;
      arweave?: Arweave;
    },
    uploadFunc: UploadFunction,
    validateFunc: ValidateFunction
  ) {
    super(
      {
        pool: -1,
        stake: 0,
        jwk: options.jwk,
        arweave: options.arweave,
      },
      uploadFunc,
      validateFunc
    );

    this.pool = options.pool;
    this.dryRun = true;
    this.APP_NAME = "KYVE - TEST";
    console.log("DRY RUNNING!");
  }

  public async run() {
    const address = await this.arweave.wallets.getAddress(this.keyfile);

    if (address === this.pool.uploader) {
      console.log("\nRunning as an uploader ...");
      this.uploader();
    } else {
      console.log("\nRunning as a validator ...");
      this.validator();
    }
  }
}
