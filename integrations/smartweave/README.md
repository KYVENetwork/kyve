<p align="center">
  <a href="https://kyve.network">
    <img src="https://user-images.githubusercontent.com/62398724/110093923-289d6400-7d93-11eb-9d37-3ab7de5b752b.png" height="96">
  </a>
  <h3 align="center"><code>@kyve/smartweave</code></h3>
  <p align="center">The official KYVE node for Smartweave.</p>
</p>

## About

The KYVE + SmartWeave node allows you to store the state from any SmartWeave contract onto Arweave. This allows
the client to load a state a given block-height without the need of calculating through
every transaction.

## Usage

There are two ways to run the node. You can either run the integration itself or
run a prebuilt version of the [KYVE Node](../node/README.md) (recommended).

```js
import SmartWeaveInstance from "@kyve/smartweave";
const poolID = ...
const stake = ...

SmartWeaveInstance(poolID, stake, wallet).run();
```

## Config

The config is pool specific. You can find a list of pool [here](https://kyve.network/gov/pools).
For this integration the config should look like this, and the architecture should be set to `SmartWeave`:

```json
{
  "contracts": ["CONTRACT_ID_1", ...]
}
```

The SmartWeave integration listens to changes happening on the contracts you specify in the config.
