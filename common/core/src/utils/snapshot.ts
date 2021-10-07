import fetch from "cross-fetch";
import { Wallet } from "ethers";
import io from "socket.io-client";
import {
  Space,
  Proposal,
  CancelProposal,
  Vote,
  Follow,
  Unfollow,
  Alias,
  spaceTypes,
  proposalTypes,
  cancelProposalTypes,
  cancelProposal2Types,
  voteTypes,
  voteArrayTypes,
  voteStringTypes,
  vote2Types,
  voteArray2Types,
  voteString2Types,
  followTypes,
  unfollowTypes,
  aliasTypes,
} from "./snapshotTypes";

const NAME = "snapshot";
const VERSION = "0.1.4";

export const domain = {
  name: NAME,
  version: VERSION,
  // chainId: 1,
};

export default class Client {
  readonly address: string;

  constructor(address: string = "https://hub.kyve.network") {
    this.address = address;
  }

  async sign(wallet: Wallet, address: string, message: any, types: any) {
    if (!message.from) message.from = address;
    if (!message.timestamp) message.timestamp = ~~(Date.now() / 1e3);
    const data: any = { domain, types, message };
    const sig = await wallet._signTypedData(domain, data.types, message);
    // console.log("Sign", { address, sig, data });
    return await this.send({ address, sig, data });
  }

  async send(envelop: any) {
    const url = `${this.address}/api/msg`;
    const init = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(envelop),
    };
    return new Promise((resolve, reject) => {
      fetch(url, init)
        .then((res) => {
          if (res.ok) return resolve(res.json());
          throw res;
        })
        .catch((e) => e.json().then((json: any) => reject(json)));
    });
  }

  async space(wallet: Wallet, address: string, message: Space) {
    return await this.sign(wallet, address, message, spaceTypes);
  }

  async proposal(wallet: Wallet, address: string, message: Proposal) {
    return await this.sign(wallet, address, message, proposalTypes);
  }

  async cancelProposal(
    wallet: Wallet,
    address: string,
    message: CancelProposal
  ) {
    const type2 = message.proposal.startsWith("0x");
    return await this.sign(
      wallet,
      address,
      message,
      type2 ? cancelProposal2Types : cancelProposalTypes
    );
  }

  async vote(wallet: Wallet, address: string, message: Vote) {
    const type2 = message.proposal.startsWith("0x");
    let type = type2 ? vote2Types : voteTypes;
    if (["approval", "ranked-choice"].includes(message.type))
      type = type2 ? voteArray2Types : voteArrayTypes;
    if (["quadratic", "weighted"].includes(message.type)) {
      type = type2 ? voteString2Types : voteStringTypes;
      message.choice = JSON.stringify(message.choice);
    }
    // @ts-ignore
    delete message.type;
    return await this.sign(wallet, address, message, type);
  }

  async follow(wallet: Wallet, address: string, message: Follow) {
    return await this.sign(wallet, address, message, followTypes);
  }

  async unfollow(wallet: Wallet, address: string, message: Unfollow) {
    return await this.sign(wallet, address, message, unfollowTypes);
  }

  async alias(wallet: Wallet, address: string, message: Alias) {
    return await this.sign(wallet, address, message, aliasTypes);
  }
}

export const ws = io("https://kyve-operator.herokuapp.com");
