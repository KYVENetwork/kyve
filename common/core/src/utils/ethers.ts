import { config } from "dotenv";
config();

import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { Contract, Wallet } from "ethers";

// Provider for the Moonbase Alpha network.
export const provider = new StaticJsonRpcProvider(
  "https://rpc.testnet.moonbeam.network",
  {
    name: "moonbase-alphanet",
    chainId: 1287,
  }
);

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
      "function unstake(uint256 amount) public",
    ],
    wallet
  );

  return pool;
};

// Helper for creating a Token instance.
export const Token = (address: string) => {
  const token = new Contract(
    address,
    [
      // Functions
      "function approve(address spender, uint256 amount) external returns (bool)",
    ],
    wallet
  );

  return token;
};
