import TestInstance from "@kyve/core/dist/testing";
import { upload, validate } from "../src";

const pool = {
  id: 400,
  pool: {
    name: "TestPool",
    architecture: "Polkadot",
    config: {
      endpoint: "wss://barnacle.rpc.testnet.oct.network:9944",
    },
    bundleSize: 10,
    uploader: "3dX8Cnz3N64nKt2EKmWpKL1EbErFP3RFjxSDyQHQrkI",
    rates: {
      uploader: 1,
      validator: 1,
    },
  },
};

const instance = new TestInstance(
  {
    pool: pool,
    uploader: true,
  },
  upload,
  validate
);
instance.run();

/*
(async () => {
  const res = await instance.validateTx(
    "RsJdbDLEDwGk8HQawTN8N6UX7V0mFHx_xChE98sDAx0"
  );
  console.log(res);
})();
*/
