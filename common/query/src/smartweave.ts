import { getData } from "@kyve/core";
import { arweaveBundles } from "@kyve/core/dist/extensions";
import ArdbTransaction from "@textury/ardb/lib/models/transaction";
import {
  BlockHeightCacheResult,
  BlockHeightKey,
  BlockHeightSwCache,
} from "redstone-smartweave";
import { Query } from ".";

export class KyveBlockHeightCache<V = any> implements BlockHeightSwCache<V> {
  private query: Query;

  constructor(pool: string) {
    // @ts-ignore
    this.query = new Query(pool, false, arweaveBundles);
  }

  async getLast(key: string): Promise<BlockHeightCacheResult<V> | null> {
    const res = (await this.query
      .tag("Target-Contract", key)
      .only(["id", "tags", "tags.name", "tags.value"])
      .findOne()) as ArdbTransaction | null;

    let cachedHeight: number | null = null;
    let cachedValue: V | null = null;

    if (res) {
      const tags = res.tags;
      const blockTag = tags.find((tag) => tag.name === "Block");

      if (blockTag) {
        cachedHeight = +blockTag.value;
        cachedValue = JSON.parse(await getData(res.id));
      }
    }

    if (cachedHeight && cachedValue) {
      return { cachedHeight, cachedValue };
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

    const cache: { id: string; height: number }[] = [];
    res.forEach((tx) => {
      const tags = tx.tags;
      const blockTag = tags.find((tag) => tag.name === "Block");

      if (blockTag) {
        cache.push({ id: tx.id, height: +blockTag.value });
      }
    });

    const val = cache
      .filter((item) => item.height <= blockHeight)
      .sort((a, b) => b.height - a.height)
      .shift();

    if (val) {
      return {
        cachedHeight: val.height,
        cachedValue: JSON.parse(await getData(val.id)),
      };
    } else {
      return null;
    }
  }

  async put(
    { cacheKey, blockHeight }: BlockHeightKey,
    value: V
  ): Promise<void> {
    throw new Error("Not implemented yet");
  }

  async contains(key: string): Promise<boolean> {
    throw new Error("Not implemented yet");
  }

  async get(
    key: string,
    blockHeight: number
  ): Promise<BlockHeightCacheResult<V> | null> {
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
