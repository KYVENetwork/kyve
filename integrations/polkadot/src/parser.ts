export const parseBlockByNumber = async (
  blockNumber: number,
  api: any
): Promise<{ block: any; tags: any }> => {
  const hash = await api.rpc.chain.getBlockHash(blockNumber);
  let block = (await api.rpc.chain.getBlock(hash)).block;
  const timestamp = (await api.query.timestamp.now.at(hash)).toNumber();

  const extrinsics: any[] = [];
  const rawEvents = await api.query.system.events.at(hash);

  block.extrinsics.forEach((ex: any, index: number) => {
    const tx = ex.toHuman();
    const events: any = [];

    const filteredEvents = rawEvents.filter(
      ({ phase }: any) =>
        phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
    );
    filteredEvents.forEach((event: any) => {
      const res = event.toHuman().event;
      events.push(res);
    });

    extrinsics.push({
      hash: ex.hash.toHuman(),
      ...tx,
      events,
    });
  });

  block = {
    hash: hash.toHex(),
    number: blockNumber,
    timestamp,
    parentHash: block.toHuman().header.parentHash,
    extrinsics,
    digest: block.toHuman().header.digest,
  };

  const tags = [
    { name: "Height", value: block.number },
    { name: "Block", value: block.hash },
  ];

  return { block, tags };
};
