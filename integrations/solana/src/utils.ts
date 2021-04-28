import fetch from "node-fetch";

export const fetchLatestSlot = async (endpoint: string): Promise<number> => {
  let raw = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: `{"jsonrpc":"2.0","id":1, "method":"getEpochInfo"}`,
  });
  let res = (await raw.json()).result;

  return res.absoluteSlot;
};

export const fetchSlots = async (
  start: number,
  end: number,
  endpoint: string
): Promise<number[]> => {
  let raw = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: `{"jsonrpc": "2.0","id":1,"method":"getConfirmedBlocks","params":[${start}, ${end}]}`,
  });
  let res = (await raw.json()).result;

  return res;
};

export const fetchSlot = async (
  slot: number,
  endpoint: string
): Promise<any> => {
  let raw = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: `{"jsonrpc": "2.0","id":1,"method":"getConfirmedBlock","params":[${slot}, "json"]}`,
  });
  let res = (await raw.json()).result;

  return res;
};
