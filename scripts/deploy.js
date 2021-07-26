const Arweave = require("arweave");
const { createContract } = require("smartweave");

const fs = require("fs");
const wallet = JSON.parse(fs.readFileSync("./arweave.json"));

const client = new Arweave({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

(async () => {
  const height = (await client.network.getInfo()).height;

  // Deploy governance contract.
  const governanceSrc = fs.readFileSync("./scripts/cXYZ.js", "utf-8");
  const governanceState = {
    name: "KYVE Testnet",
    ticker: "KYVE",
    balances: {
      vxUdiv2fGHMiIoek5E4l3M5qSuKCZtSaOBYjMRc94JU: 1000,
      "s-hGrOFm1YysWGC3wXkNaFVpyrjdinVpRKiVnhbo2so": 1000,
    },
    vault: {
      vxUdiv2fGHMiIoek5E4l3M5qSuKCZtSaOBYjMRc94JU: [
        {
          balance: 1000,
          end: height + 5000,
          start: height,
        },
      ],
      "s-hGrOFm1YysWGC3wXkNaFVpyrjdinVpRKiVnhbo2so": [
        {
          balance: 1000,
          end: height + 5000,
          start: height,
        },
      ],
    },
    votes: [],
    roles: {},
    settings: [
      ["quorum", 0.5],
      ["support", 0.5],
      ["voteLength", 50],
      ["lockMinLength", 5],
      ["lockMaxLength", 5000],
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
  console.log(`Governance:\n  ${governance}`);

  // Deploy treasury contract.
  const treasurySrc = fs.readFileSync(
    "./contract/treasury/dist/index.js",
    "utf-8"
  );
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
  console.log(`Treasury:\n  ${treasury}`);

  // Deploy pool contract source.
  const poolSrc = fs.readFileSync("./contract/pool/dist/index.js", "utf-8");

  const pool = await client.createTransaction({ data: poolSrc }, wallet);

  pool.addTag("App-Name", "SmartWeaveContractSource");
  pool.addTag("App-Version", "0.3.0");
  pool.addTag("Content-Type", "application/javascript");

  await client.transactions.sign(pool, wallet);
  await client.transactions.post(pool);

  console.log(`Pool source:\n  ${pool.id}`);
})();
