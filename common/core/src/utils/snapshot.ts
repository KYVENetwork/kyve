import { version } from "@snapshot-labs/snapshot.js/src/constants.json";
import hubs from "@snapshot-labs/snapshot.js/src/hubs.json";
import fetch from "cross-fetch";
import { Wallet } from "ethers";
import { gql, request } from "graphql-request";
import WebSocket from "ws";

export default class Client {
  readonly address: string;

  constructor(address: string = hubs[0]) {
    this.address = address;
  }

  request(command: string, body?: any) {
    const url = `${this.address}/api/${command}`;
    // @ts-ignore
    let init;
    if (body) {
      init = {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      };
    }
    return new Promise((resolve, reject) => {
      // @ts-ignore
      fetch(url, init)
        .then((res) => {
          if (res.ok) return resolve(res.json());
          throw res;
        })
        // @ts-ignore
        .catch((e) => e.json().then((json) => reject(json)));
    });
  }

  async send(msg: any) {
    return this.request("message", msg);
  }

  async getSpaces() {
    return this.request("spaces");
  }

  async broadcast(wallet: Wallet, space: string, type: string, payload: any) {
    const msg: any = {
      address: await wallet.getAddress(),
      msg: JSON.stringify({
        version,
        timestamp: (Date.now() / 1e3).toFixed(),
        space,
        type,
        payload,
      }),
    };
    msg.sig = await wallet.signMessage(msg.msg);
    return await this.send(msg);
  }

  // @ts-ignore
  async vote(wallet: Wallet, space, { proposal, choice, metadata = {} }) {
    return this.broadcast(wallet, space, "vote", {
      proposal,
      choice,
      metadata,
    });
  }

  async proposal(
    wallet: Wallet,
    space: string,
    {
      // @ts-ignore
      name,
      // @ts-ignore
      body,
      // @ts-ignore
      choices,
      // @ts-ignore
      start,
      // @ts-ignore
      end,
      // @ts-ignore
      snapshot,
      type = "single-choice",
      metadata = {},
    }
  ) {
    return this.broadcast(wallet, space, "proposal", {
      name,
      body,
      choices,
      start,
      end,
      snapshot,
      type,
      metadata,
    });
  }

  // @ts-ignore
  async deleteProposal(wallet: Wallet, space: string, { proposal }) {
    return this.broadcast(wallet, space, "delete-proposal", {
      proposal,
    });
  }

  // @ts-ignore
  async settings(wallet: Wallet, space: string, settings) {
    return this.broadcast(wallet, space, "settings", settings);
  }
}

export const Query = async (proposal: string): Promise<string> => {
  const query = gql`
    {
      proposal(id: "${proposal}") {
        body
      }
    }
  `;

  const res = await request("https://hub.snapshot.org/graphql", query);
  return res.data.proposal.body;
};

export const ws = new WebSocket(""); // TODO
