import Arweave from "arweave";

const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const untilMined = async (txID: string, arweave: Arweave) => {
  let status = (await arweave.transactions.getStatus(txID)).status;

  while (status !== 200) {
    await sleep(30000);

    status = (await arweave.transactions.getStatus(txID)).status;

    if (status === 200 || status === 202) {
      // mined / pending
      console.log(`\nWaiting for TX ${txID} to be mined.`);
    } else {
      throw Error(`Transaction ${txID} was not mined.`);
    }
  }
};
