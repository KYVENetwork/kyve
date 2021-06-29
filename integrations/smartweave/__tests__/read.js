const Arweave = require("arweave");
const { readContract } = require("smartweave");

const client = new Arweave({
  host: "localhost",
  port: 1984,
  protocol: "http",
});

(async () => {
  console.log(
    await readContract(client, "J9bzj8gW9nVKNaNm50mG68Ib-qXwA5fE3XHxd0MUZNE")
  );
})();
