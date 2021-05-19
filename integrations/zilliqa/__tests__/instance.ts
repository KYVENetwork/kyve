import TestInstance from "@kyve/core/dist/testing";
import { upload, validate } from "../src";
import fs from "fs";

const pool = {
  id: 0,
  pool: {
    name: "Zilliqa TestPool",
    architecture: "Zilliqa",
    config: {
      endpoint: "wss://api-ws.zilliqa.com",
      api: "https://api.zilliqa.com/",
    },
    bundleSize: 20,
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
