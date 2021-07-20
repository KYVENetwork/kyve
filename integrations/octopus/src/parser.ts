export const parseBlockByNumber = async (
  blockNumber: number,
  api: any,
  client: any
): Promise<{ block: any; tags: any }> => {
  const hash = await api.rpc.chain.getBlockHash(blockNumber);

  const result = await client.request({
    method: "chain_getBlock",
    params: [hash.toHex()],
  });
  let block = JSON.stringify(result);

  const tags = [
    {
      name: "ChainId",
      value: (await api.query.octopusAppchain.appchainId()).toHuman(),
    },
    { name: "Height", value: blockNumber },
    { name: "Block", value: hash.toHex() },
  ];

  return { block, tags };
};
