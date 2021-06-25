// @ts-ignore
import ArLocal from "@textury/arlocal";
import Arweave from "arweave";
import fs from "fs";
import { createContract, interactWrite } from "smartweave";
import SmartWeaveInstance from "../src/index";

const gateway = new ArLocal(undefined, false, "db");

(async () => {
  // Start the local Arweave gateway.
  await gateway.start();

  // Create a new Arweave client.
  const client = new Arweave({
    host: "localhost",
    port: 1984,
    protocol: "http",
  });

  // Define a mining helper.
  const mine = async () => {
    await client.api.get("mine");
  };

  // Create two wallets (uploader, validator).
  const walletUploader = await client.wallets.generate();
  const walletValidator = await client.wallets.generate();

  const addrUploader = await client.wallets.jwkToAddress(walletUploader);
  const addrValidator = await client.wallets.jwkToAddress(walletValidator);

  // Deploy the governance contract.
  const governanceSrc = (
    await client.api.get(
      "https://arweave.net/ngMml4jmlxu0umpiQCsHgPX2pb_Yz6YDB8f7G6j-tpI"
    )
  ).data;
  const governanceState = {
    name: "KYVE Testnet",
    ticker: "KYVE",
    balances: {
      [addrValidator]: 100,
    },
    vault: {},
    votes: [],
    roles: {},
    settings: [
      ["quorum", 0.5],
      ["support", 0.5],
      ["voteLength", 2000],
      ["lockMinLength", 5],
      ["lockMaxLength", 720],
    ],
  };

  const governance = await createContract(
    client,
    walletUploader,
    governanceSrc,
    JSON.stringify(governanceState)
  );
  await mine();

  // Deploy a SmartWeave pool contract.
  const contractSrc = fs.readFileSync(
    "../../contract/@pool/dist/index.js",
    "utf-8"
  );
  const contractState = {
    settings: {
      gracePeriod: 5,
      slashThreshold: 2,
      payout: {
        kyvePerByte: 1,
        idleCost: 0,
      },
      foriegnContracts: {
        governance,
      },
      uploader: addrUploader,
      bundleSize: 1,
    },
    config: {
      contracts: [governance],
    },
    credit: {
      [addrUploader]: {
        amount: 50,
        stake: 25,
        fund: 1000000000,
        points: 0,
      },
      [addrValidator]: {
        amount: 50,
        stake: 25,
        fund: 1000000000,
        points: 0,
      },
    },
    txs: {},
  };

  const contract = await createContract(
    client,
    walletUploader,
    contractSrc,
    JSON.stringify(contractState)
  );
  await mine();

  // Test deposit from governance to pool.
  // await interactWrite(
  //   client,
  //   walletValidator,
  //   governance,
  //   {
  //     function: "transfer",
  //     target: contract,
  //     qty: 100,
  //   },
  //   [
  //     { name: "Contract", value: contract },
  //     { name: "Input", value: JSON.stringify({ function: "deposit" }) },
  //   ]
  // );
  // await mine();

  // Test funding and staking inside the pool contract.

  // Turn auto mining on.
  setInterval(async () => {
    await mine();

    if ((await client.network.getInfo()).height % 5 === 0) {
      await interactWrite(client, walletValidator, governance, {
        function: "transfer",
        target: addrUploader,
        qty: 10,
      });
    }
  }, 5000);

  // Start up an uploader
  const uploader = SmartWeaveInstance(contract, 25, walletUploader);
  uploader.run();

  // Start up a validator
  const validator = SmartWeaveInstance(contract, 25, walletValidator);
  validator.run();
})();
