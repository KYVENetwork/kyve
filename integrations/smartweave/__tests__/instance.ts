import TestInstance from "@kyve/core/dist/testing";
import { upload, validate } from "../src";
import fs from "fs";

const pool = {
  id: 400,
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

const jwk = JSON.parse(fs.readFileSync("./arweave-uploader.json").toString());

const instance = new TestInstance(
  {
    pool: pool,
    jwk,
  },
  upload,
  validate
);

instance.run();
