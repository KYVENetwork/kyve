// @ts-ignore
import ArLocal from "@textury/arlocal";
import Arweave from "arweave";
import fs from "fs";
import {
  createContract,
  interactWrite,
  interactWriteDryRun,
  readContract,
} from "smartweave";
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
  // const governanceSrc = (
  //   await client.api.get(
  //     "https://arweave.net/ngMml4jmlxu0umpiQCsHgPX2pb_Yz6YDB8f7G6j-tpI"
  //   )
  // ).data;
  const governanceSrc = fs.readFileSync("./cXYZ.js", "utf-8");
  const governanceState = {
    name: "KYVE Testnet",
    ticker: "KYVE",
    balances: {
      [addrValidator]: 5000000010,
    },
    vault: {
      [addrUploader]: [
        {
          balance: 100,
          end: 10,
          start: 0,
        },
      ],
      [addrValidator]: [
        {
          balance: 100,
          end: 10,
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
      foreignContracts: {
        governance,
        treasury: "kyveKYVEkyve",
      },
      uploader: addrUploader,
      bundleSize: 2,
    },
    config: {
      contracts: [governance],
    },
    credit: {
      [addrUploader]: {
        amount: 0,
        stake: 25,
        fund: 0,
        points: 0,
      },
      [addrValidator]: {
        amount: 0,
        stake: 25,
        fund: 0,
        points: 0,
      },
    },
    txs: {},
    invocations: [],
    foreignCalls: [],
  };

  const contract = await createContract(
    client,
    walletUploader,
    contractSrc,
    JSON.stringify(contractState)
  );
  await mine();

  //
  const res = await client.api.post(
    "graphql",
    {
      query: `
      query($contract: ID!) {
        transactions(ids: [$contract]) {
          edges {
            node {
              tags {
                name
                value
              }
            }
          }
        }
      }
  `,
      variables: { contract },
    },
    { headers: { "content-type": "application/json" } }
  );
  const tags: { name: string; value: string }[] =
    res.data.data.transactions.edges[0].node.tags;
  const sourceTag = tags.find((tag) => tag.name === "Contract-Src");

  await interactWrite(client, walletUploader, governance, {
    function: "propose",
    type: "addTrustedSource",
    source: sourceTag?.value!,
    note: "",
  });
  await mine();

  await interactWrite(client, walletUploader, governance, {
    function: "vote",
    id: 0,
    cast: "yay",
  });
  await mine();
  await mine();

  await interactWrite(client, walletUploader, governance, {
    function: "finalize",
    id: 0,
  });
  await mine();

  // Test deposit and withdraw functionality.
  await interactWrite(
    client,
    walletValidator,
    governance,
    {
      function: "transfer",
      target: contract,
      qty: 1000000010,
    },
    [
      { name: "Contract", value: contract },
      { name: "Input", value: JSON.stringify({ function: "deposit" }) },
    ]
  );
  await mine();

  await interactWrite(
    client,
    walletValidator,
    contract,
    {
      function: "withdraw",
      qty: 10,
    },
    [
      { name: "Contract", value: governance },
      {
        name: "Input",
        value: JSON.stringify({ function: "readOutbox", contract }),
      },
    ]
  );
  await mine();

  await interactWrite(client, walletValidator, contract, {
    function: "fund",
    qty: 1000000000,
  });
  await mine();

  // Turn auto mining on.
  setInterval(async () => {
    await mine();
    await interactWrite(client, walletUploader, governance, {
      function: "readOutbox",
      contract,
    });
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
