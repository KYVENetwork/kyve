import TestInstance from "@kyve/core/dist/testing";
import { upload, validate } from "../src";

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

const instance = new TestInstance(
  {
    pool: pool,
    uploader: true,
  },
  upload,
  validate
);

instance.run();
