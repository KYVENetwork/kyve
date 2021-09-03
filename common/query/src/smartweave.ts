import { getData } from "@kyve/core";
import { arweaveClient } from "@kyve/core/dist/extensions";
import ArdbTransaction from "@textury/ardb/lib/models/transaction";
import {
  BlockHeightCacheResult,
  BlockHeightKey,
  BlockHeightSwCache,
} from "redstone-smartweave";
import { Query } from ".";

export class KyveBlockHeightCache<V = any> implements BlockHeightSwCache<V> {
  private query: Query;
  private storage: { [key: string]: Map<number, V> } = {};

  constructor(pool: string) {
    this.query = new Query(pool, false, arweaveClient);
  }

  async getLast(key: string): Promise<BlockHeightCacheResult<V> | null> {
    const res = (await this.query
      .tag("Target-Contract", key)
      .only(["id", "tags", "tags.name", "tags.value"])
      .findOne()) as ArdbTransaction | null;

    const cache: number[] = [];
    if (res) {
      const tags = res.tags;
      const blockTag = tags.find((tag) => tag.name === "Block");

      if (blockTag) {
        const height = +blockTag.value;
        cache.push(height);

        await this.put(
          { cacheKey: key, blockHeight: height },
          JSON.parse(await getData(res.id))
        );
      }
    }
    if (this.contains(key)) {
      cache.push([...this.storage[key].keys()].sort().pop()!);
    }

    const val = cache.sort().pop();

    if (val) {
      return {
        cachedHeight: val,
        cachedValue: (await this.get(key, val))?.cachedValue!,
      };
    } else {
      return null;
    }
  }

  async getLessOrEqual(
    key: string,
    blockHeight: number
  ): Promise<BlockHeightCacheResult<V> | null> {
    const res = (await this.query
      .tag("Target-Contract", key)
      .only(["id", "tags", "tags.name", "tags.value"])
      .findAll()) as ArdbTransaction[];

    const cache: number[] = [];
    res.forEach(async (tx) => {
      const tags = tx.tags;
      const blockTag = tags.find((tag) => tag.name === "Block");

      if (blockTag) {
        const height = +blockTag.value;
        cache.push(height);

        await this.put(
          { cacheKey: key, blockHeight: height },
          JSON.parse(await getData(tx.id))
        );
      }
    });
    if (await this.contains(key)) {
      cache.concat([...this.storage[key].keys()]);
    }

    const val = cache
      .filter((height) => height <= blockHeight)
      .sort()
      .pop();

    if (val) {
      return {
        cachedHeight: val,
        cachedValue: (await this.get(key, val))?.cachedValue!,
      };
    } else {
      return null;
    }
  }

  async put(
    { cacheKey, blockHeight }: BlockHeightKey,
    value: V
  ): Promise<void> {
    if (!(await this.contains(cacheKey))) {
      this.storage[cacheKey] = new Map();
    }

    this.storage[cacheKey].set(blockHeight, value);
  }

  async contains(key: string): Promise<boolean> {
    return Object.prototype.hasOwnProperty.call(this.storage, key);
  }

  async get(
    key: string,
    blockHeight: number
  ): Promise<BlockHeightCacheResult<V> | null> {
    if ((await this.contains(key)) && this.storage[key].has(blockHeight)) {
      return {
        cachedHeight: blockHeight,
        cachedValue: this.storage[key].get(blockHeight)!,
      };
    }

    const res = (await this.query
      .tag("Target-Contract", key)
      .tag("Block", blockHeight.toString())
      .only("id")
      .findOne()) as ArdbTransaction | null;

    let cachedValue: V | null = null;

    if (res) {
      cachedValue = JSON.parse(await getData(res.id));
    }

    if (cachedValue) {
      return { cachedHeight: blockHeight, cachedValue };
    } else {
      return null;
    }
  }
}
