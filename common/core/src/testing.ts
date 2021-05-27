import KYVE from "./index";
import { UploadFunction, ValidateFunction } from "./faces";
import { JWKInterface } from "arweave/node/lib/wallet";
import Arweave from "arweave";

class TestInstance extends KYVE {
  private readonly isUploader: boolean;

  constructor(
    options: {
      // todo add pool face
      pool: { id: number; pool: any };
      uploader: boolean;
      arweave?: Arweave;
    },
    uploadFunc: UploadFunction,
    validateFunc: ValidateFunction
  ) {
    super(
      {
        pool: -1,
        stake: 0,
        jwk: {} as JWKInterface,
        arweave: options.arweave,
      },
      uploadFunc,
      validateFunc
    );

    this.pool = options.pool.pool;
    this.poolID = options.pool.id;

    this.dryRun = true;
    this.APP_NAME = "KYVE - TEST";
    this.isUploader = options.uploader;

    console.log("DRY RUNNING!");
  }

  public async run() {
    this.keyfile = await this.arweave.wallets.generate();

    const address = await this.arweave.wallets.getAddress(this.keyfile);
    console.log("Address:", address);

    if (this.isUploader) {
      console.log("\nRunning as an uploader ...");
      this.uploader();
    } else {
      console.log("\nRunning as a validator ...");
      this.validator();
    }
  }
}

export default TestInstance;
