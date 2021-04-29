import { ActionInterface, CreatePoolInterface, StateInterface } from "../faces";

declare const ContractError: any;
declare const SmartWeave: any;

export const CreatePool = (state: StateInterface, action: ActionInterface) => {
  const pools = state.pools;

  const input: CreatePoolInterface = action.input;
  const name = input.name;
  const architecture = input.architecture;
  const config = input.config;

  if (!name) {
    throw new ContractError(`No name specified.`);
  }
  if (!architecture) {
    throw new ContractError(`No architecture specified.`);
  }

  pools.push({
    name,
    architecture,
    config,

    balance: 0,
    vault: {},
    rates: { uploader: 1, validator: 1 },

    uploader: undefined,
    registered: [],
    denials: [],
    lastPayout: SmartWeave.block.height,
    bundleSize: 10,
  });

  return { ...state, pools };
};
