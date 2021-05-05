<p align="center">
  <a href="https://kyve.network">
    <img src="https://user-images.githubusercontent.com/62398724/111903348-c5b9f700-8a39-11eb-9549-49b92072b16e.png" height="250">
  </a>
  <h3 align="center"><code>@kyve/zilliqa</code></h3>
  <p align="center">The official KYVE node for Zilliqa.</p>
</p>

## About

The KYVE + zilliqa node allows you to bridge any data stream from an Zilliqa chain onto Arweave.

## Usage

There are two ways to run the node. You can either run the integration itself or
run a prebuilt version of the [KYVE Node](../node/README.md).

```js
import ZilliqaInstance from "@kyve/zilliqa";
const poolID = ...
const stake = ...

ZilliqaInstance(poolID, stake, jwk).run();
```

## Config

The config is pool specific. You can find a list of pool [here](https://kyve.network/gov/pools).
For this integration the config should look like this:

```json
{
  "endpoint": "wss://...."
}
```

The Zilliqa integration uses the websocket endpoint to listen to
the latest block data. For more information have a look at their
[documentation](https://dev.zilliqa.com/docs/dev/dev-tools-websockets/).
