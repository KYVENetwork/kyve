// @ts-ignore
import ArLocal from "@textury/arlocal";
import Arweave from "arweave";
import fs from "fs";
import { createContract, interactWrite, readContract } from "smartweave";

const gateway = new ArLocal(1984, false);

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

  // Create a wallet for the user, and a "pool address".
  const wallet = await client.wallets.generate();
  const addr = await client.wallets.jwkToAddress(wallet);

  const pool = await client.wallets.jwkToAddress(
    await client.wallets.generate()
  );

  // Deploy the governance contract.
  const governanceSrc = fs.readFileSync("./__tests__/cXYZ.js", "utf-8");
  const governanceState = {
    name: "KYVE Testnet",
    ticker: "KYVE",
    balances: {
      [addr]: 1000,
    },
    vault: {
      [addr]: [
        {
          balance: 1000,
          end: 100,
          start: 0,
        },
      ],
    },
    votes: [],
    roles: {},
    settings: [
      ["quorum", 0.5],
      ["support", 0.5],
      ["voteLength", 2],
      ["lockMinLength", 5],
      ["lockMaxLength", 720],
    ],
    trusted: {
      contracts: [],
      sources: [],
    },
    invocations: [],
    foreignCalls: [],
  };

  const governance = await createContract(
    client,
    wallet,
    governanceSrc,
    JSON.stringify(governanceState)
  );
  await mine();

  // Deploy the treasury contract.
  const treasurySrc = fs.readFileSync("./dist/index.js", "utf-8");
  const treasuryState = {
    governanceContract: governance,
    invocations: [],
    foreignCalls: [],
  };

  const treasury = await createContract(
    client,
    wallet,
    treasurySrc,
    JSON.stringify(treasuryState)
  );
  await mine();

  // Trust the treasury contract.
  await interactWrite(client, wallet, governance, {
    function: "propose",
    type: "addTrustedContract",
    contract: treasury,
    note: "",
  });
  await mine();

  await interactWrite(client, wallet, governance, {
    function: "vote",
    id: 0,
    cast: "yay",
  });
  await mine();
  await mine();

  await interactWrite(client, wallet, governance, {
    function: "finalize",
    id: 0,
  });
  await mine();

  // Transfer tokens to the treasury.
  await interactWrite(client, wallet, governance, {
    function: "transfer",
    target: treasury,
    qty: 1000,
  });
  await mine();

  // Vote to transfer from treasury to "pool".
  await interactWrite(client, wallet, governance, {
    function: "propose",
    type: "invoke",
    contract: treasury,
    invocation: {
      function: "transfer",
      target: pool,
      qty: 500,
    },
    note: "",
  });
  await mine();

  await interactWrite(client, wallet, governance, {
    function: "vote",
    id: 1,
    cast: "yay",
  });
  await mine();
  await mine();

  await interactWrite(
    client,
    wallet,
    governance,
    {
      function: "finalize",
      id: 1,
    },
    [
      { name: "Contract", value: treasury },
      { name: "Input", value: JSON.stringify({ function: "readOutbox" }) },
    ]
  );
  await mine();

  // Read the treasury outbox.
  await interactWrite(client, wallet, governance, {
    function: "readOutbox",
  });
  await mine();

  // Read the states of both contracts.
  console.log(await readContract(client, governance));
  console.log(await readContract(client, treasury));

  // Stop the local Arweave gateway.
  await gateway.stop();
})();
