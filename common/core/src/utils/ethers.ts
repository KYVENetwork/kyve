import { config } from "dotenv";
config();

import { StaticJsonRpcProvider } from "@ethersproject/providers";
import Snapshot from "@snapshot-labs/snapshot.js";
import { Contract, Wallet } from "ethers";

// Provider for the Moonbase Alpha network.
export const provider: StaticJsonRpcProvider =
  Snapshot.utils.getProvider("1287");

// Initialise the wallet class.
export const wallet = new Wallet(process.env.PK?.toString()!, provider);

// Helper for creating a Pool instance.
export const Pool = (address: string) => {
  const pool = new Contract(
    address,
    [
      // Variables
      "function _uploader() external view returns (address)",
      "function _stakingAmounts(address node) external view returns (uint256)",
      "function _settings() external view returns (string)",
      "function _config() external view returns (string)",
      // Functions
      "function stake(uint256 amount) public",
    ],
    wallet
  );

  return pool;
};
