import KYVE, { getData } from "./index";
import {
  ListenFunctionReturn,
  UploadFunction,
  ValidateFunction,
  ValidateFunctionReturn,
} from "./faces";
import { JWKInterface } from "arweave/node/lib/wallet";
import Arweave from "arweave";
import { Observable } from "rxjs";
import { GQLEdgeTransactionInterface } from "ardb/lib/faces/gql";

class TestInstance extends KYVE {
  private readonly isUploader: boolean;

  constructor(
    options: {
      // todo add pool face
      pool: { id: string; pool: any };
      uploader: boolean;
      arweave?: Arweave;
    },
    uploadFunc: UploadFunction,
    validateFunc: ValidateFunction
  ) {
    super(
      {
        pool: "abc",
        stake: 0,
        jwk: {} as JWKInterface,
        arweave: options.arweave,
      },
      uploadFunc,
      validateFunc
    );

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

  public async validateTx(id: string) {
    const listener = new Observable<ListenFunctionReturn>((subscriber) => {
      (async () => {
        const res = (await this.ardb
          .search()
          .id(id)
          .findOne()) as GQLEdgeTransactionInterface[];

        if (res.length) {
          const node = res[0].node;
          const data: any[] = JSON.parse(await getData(node.id));

          subscriber.next({
            id: node.id,
            data,
            transaction: node,
            block: node.block.height,
          });
        }
      })();
    });

    const node = new Observable<ValidateFunctionReturn>((subscriber) => {
      this.validateFunc(
        listener,
        subscriber,
        this.poolID,
        this.pool.state?.config
      );
    });

    node.subscribe((res) => {
      if (res.id === id) {
        console.log("Valid");
        return res.valid;
      } else {
        console.log("Invalid");
        process.exit(1);
      }
    });
  }
}

export default TestInstance;
