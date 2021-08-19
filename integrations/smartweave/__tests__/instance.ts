import TestInstance from "@kyve/core/dist/testing";
import { upload, validate } from "../src";

const pool = {
  id: "400",
  pool: {
    name: "TestPool",
    architecture: "SmartWeave",
    config: {
      contracts: ["-NpR1D0UzGTNuLzG4XN4ZfKKnVOceHMpiDvtHBJ3MXo"],
    },
    bundleSize: 1,
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

(async () => {
  const res = await instance.validateTx(
    "FCFNuYAMwizcCQpjApVDlZHdEdDG0cArV1aIVZkGDYM"
  );
  console.log(res);
})();
// instance.run();
