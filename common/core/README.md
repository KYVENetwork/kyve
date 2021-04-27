<p align="center">
  <a href="https://kyve.network">
    <img src="https://user-images.githubusercontent.com/62398724/110093923-289d6400-7d93-11eb-9d37-3ab7de5b752b.png" height="96">
  </a>
  <h3 align="center"><code>@kyve/logic</code></h3>
  <p align="center">A protocol for verified data streams.</p>
</p>

## Usage

### Installation

```
yarn add @kyve/logic
```

### Using KYVE in your application

#### Initiating a node

```ts
import KYVE from "@kyve/logic";

const node = new KYVE();
```

#### Node configuration

KYVE requires two custom functions. One which fetches the data from your data source and one which validates this data.
You can then simply add these two functions into the KYVE instance.

###### Specifying an upload function

To pass data into KYVE, simply call `subscriber.next()`:

```ts
const myDataFetcher = async (subscriber) => {
  // use your custom logic here
  const data = ...
  subscriber.next({ data });
}
```

You can also optionally add custom tags to your transactions:

```ts
const myDataFetcher = async (subscriber) => {
  // use your custom logic here
  const data = ...
  const tags = [...]
  subscriber.next({ data, tags });
}
```

###### Specifying a validation function

```ts
const myDataValidator = async (subscriber) => {
  // fetch the data uploaded onto Arweave
  const fetchedData = ...
  const arweaveTxId = ...
  // validate the data with your custom logic
  const isValid = ...
  // pass the result into KYVE
  subscriber.next({ valid: isValid, id: arweaveTxId });
}
```

###### Giving the node your functions

```ts
import KYVE from "@kyve/logic";

const node = new KYVE(myDataFetcher, myDataValidator);
```

###### Pool configuration

Next you need to set up the pool. You can create a new pool here.
After you have created the pool, insert its name and your arweave keyfile into the node config:

```ts
import KYVE from "@kyve/logic";

const pool = "demo-pool";
const jwk = ...

const node = new KYVE(myDataFetcher, myDataValidator, { pool, jwk });
```

###### Running your node

To run your node, simply call the `.run()` function:

```ts
import KYVE from "@kyve/logic";

const pool = "demo-pool";
const jwk = ...

const node = new KYVE(myDataFetcher, myDataValidator, { pool, jwk });

(async () => {
  await node.run();
})();
```

## Querying data
