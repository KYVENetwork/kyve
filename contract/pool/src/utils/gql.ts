declare const SmartWeave: any;

const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const Query = async (query: string, variables?: Object) => {
  let res = await SmartWeave.unsafeClient.api.post("graphql", {
    query,
    variables,
  });

  while (res.status === 403) {
    await sleep(30 * 1000);

    res = await SmartWeave.unsafeClient.api.post("graphql", {
      query,
      variables,
    });
  }

  return res;
};
