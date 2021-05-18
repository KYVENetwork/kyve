import TestInstance from "@kyve/core/dist/testing";
import { upload, validate } from "../src";
import fs from "fs";

const pool = {
  id: 2048,
  pool: {
    name: "wAR",
    architecture: "ETH_Events",
    config: {
      endpoint: "ws://localhost:7545",
      abi: "ahHq3Ah4UFjC1T-GDnp1hdpmpeoamLNTQfKmtlrYX5U",
      address: "0xdb1Df2d244989c738775d4101b9E2fd2F754caC6",
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
