const Arweave = require("arweave");
const { readContract } = require("smartweave");

const client = new Arweave({
  host: "localhost",
  port: 1984,
  protocol: "http",
});

(async () => {
  console.log(
    await readContract(client, "7oLQBwLl4ZWEzRIee4O2hDojLYA6UDzhCM2i65Ah2lc")
  );
})();
