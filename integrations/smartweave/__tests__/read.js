const Arweave = require("arweave");
const { readContract } = require("smartweave");

const client = new Arweave({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

(async () => {
  console.log(
    await readContract(client, "5pSyVjFI07z8mbLeQhYBMsQ4M_MPidXIGX6T77rnF2s")
  );
})();
