import { ActionInterface, PayoutInterface, StateInterface } from "../faces";

declare const ContractError: any;
declare const SmartWeave: any;

export const Payout = (state: StateInterface, action: ActionInterface) => {
  const pools = state.pools;
  const balances = state.balances;

  const input: PayoutInterface = action.input;
  const id = input.id;

  if (id >= pools.length || id < 0) {
    throw new ContractError(`Invalid pool id.`);
  }
  const pool = pools[id];
  if (SmartWeave.block.height < pool.lastPayout + 150) {
    throw new ContractError(`It hasn't been 150 blocks since the last payout.`);
  }

  const lost = pool.denials.length / pool.registered.length >= 0.5;

  if (lost) {
    // Uploader is invalid.

    const qty = pool.vault[pool.uploader];
    pool.balance += qty;
    pool.vault[pool.uploader] = 0;

    for (const address of pool.registered) {
      if (pool.denials.indexOf(address) !== -1) {
        // Payout.
        balances[address] += pool.rates.validator;
        pool.balance -= pool.rates.validator;
      } else {
        // Slash stake.
        const qty = pool.vault[address];
        pool.balance += qty;
        pool.vault[address] = 0;
      }
    }

    // Address with highest stake becomes new uploader.
    let newUploader: string,
      max = -1;
    for (const [key, value] of Object.entries(pool.vault)) {
      if (value >= max) {
        newUploader = key;
        max = value;
      }
    }
    pool.uploader = newUploader;
  } else {
    // Uploader is valid.

    balances[pool.uploader] += pool.rates.uploader;
    pool.balance -= pool.rates.uploader;

    for (const address of pool.registered) {
      if (pool.denials.includes(address)) {
        // Slash stake.
        const qty = pool.vault[address];
        pool.balance += qty;
        pool.vault[address] = 0;
      } else {
        // Payout.
        balances[address] += pool.rates.validator;
        pool.balance -= pool.rates.validator;
      }
    }
  }
  pool.lastPayout = SmartWeave.block.height;

  return { ...state, pools };
};
