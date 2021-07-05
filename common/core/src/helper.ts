import Arweave from "arweave";
import Log from "./logger";

const log = new Log("node");


const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const untilMined = async (txID: string, arweave: Arweave) => {
  let status = (await arweave.transactions.getStatus(txID)).status;

  while (status !== 200) {
    await sleep(30 * 1000);

    status = (await arweave.transactions.getStatus(txID)).status;

    if (status === 200 || status === 202) {
      // mined / pending
      log.info(`Waiting for TX ${txID} to be mined.`);
    } else {
      throw Error(`Transaction ${txID} was not mined. Please check your wallet balance or try again.`);
    }
  }
};
