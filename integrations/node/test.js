const axios = require("axios");

(async () => {
  const res = await axios.get(
    "https://arweave.net/8L0pMLWpv2oG0cyoMAtJGv1MUeZs2P2BGd24vD4emU4"
  );
  const data = JSON.stringify(res.data);
  console.log(res);

  console.log(data.length);
  console.log(Buffer.from(data).length);
  console.log(Buffer.from(data).byteLength);
})();
