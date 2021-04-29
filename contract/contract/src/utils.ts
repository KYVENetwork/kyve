import { handle } from ".";
import SmartWeaveTester from "smartweave-testing";
import { StateInterface } from "./faces";

const state: StateInterface = {
  name: "KYVE Testnet",
  ticker: "KYVE",
  migrated: false,
  balances: {
    "3dX8Cnz3N64nKt2EKmWpKL1EbErFP3RFjxSDyQHQrkI": 100,
    vxUdiv2fGHMiIoek5E4l3M5qSuKCZtSaOBYjMRc94JU: 100,
  },
  vault: {},
  pools: [
    {
      name: "Avalanche // C-Chain",
      architecture: "Avalanche",
      config: { endpoint: "wss://api.avax.network/ext/bc/C/ws" },
      balance: 150,
      vault: {
        "3dX8Cnz3N64nKt2EKmWpKL1EbErFP3RFjxSDyQHQrkI": 100,
      },
      rates: { uploader: 1, validator: 1 },
      uploader: "3dX8Cnz3N64nKt2EKmWpKL1EbErFP3RFjxSDyQHQrkI",
      registered: ["vxUdiv2fGHMiIoek5E4l3M5qSuKCZtSaOBYjMRc94JU"],
      denials: [],
      lastPayout: 0,
      bundleSize: 10,
    },
  ],
  votes: [],
};

const caller = "vxUdiv2fGHMiIoek5E4l3M5qSuKCZtSaOBYjMRc94JU";

export const copy = (o: Object) => {
  return JSON.parse(JSON.stringify(o));
};

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

export const { assert, expect } = chai;

export default new SmartWeaveTester(handle, state, caller);
