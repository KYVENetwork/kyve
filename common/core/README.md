<p align="center">
  <a href="https://kyve.network">
    <img src="https://user-images.githubusercontent.com/62398724/110093923-289d6400-7d93-11eb-9d37-3ab7de5b752b.png" height="96">
  </a>
  <h3 align="center"><code>@kyve/core</code></h3>
  <p align="center">A protocol for verified data streams.</p>
</p>

## Usage

### Installation

```
yarn add @kyve/core
```

### Creating a custom integration

#### Initiating a node

```ts
import KYVE from "@kyve/core";

const node = new KYVE();
```

#### Node configuration

KYVE requires two custom functions. One which fetches the data from your data source and one which validates this data.
You can then simply add these two functions into the KYVE instance later on.

###### Specifying an upload function

To pass data into KYVE, simply call `uploader.next()`:

```ts
const myDataUploader = async (uploader: UploadFunctionSubscriber, config: any) => {
  // use your custom logic here
  const data = ...
  uploader.next({ data });
}
```

You can also optionally add custom tags to your transactions:

```ts
const myDataUploader = async (uploader: UploadFunctionSubscriber, config: any) => {
  // use your custom logic here
  const data = ...
  const tags = [...]
  uploader.next({ data, tags });
}
```

The config value can be set in the DAO for the pool You can find the list of pools [here](https://kyve.network/gov/pools)

###### Specifying a validation function

The listener will automatically return new and unvalidated transactions from the uploader,
which you can pass into your logic.

```ts
const myDataValidator = async (listener: ListenFunctionObservable,
                               validator: ValidateFunctionSubscriber,
                               config: any) => {

  listener.subscribe(async (ret: ListenFunctionReturn) => {
        // validate the data with your custom logic
        const isValid = ...
        // pass the result into KYVE
        validator.next({ valid: isValid, id: ret.id });
    });
}
```

###### Passing the functions into the node.

```ts
import KYVE from "@kyve/logic";

const node = new KYVE(myDataFetcher, myDataValidator);
```

###### Pool configuration

Next you need to set up the pool in the DAO. You can create a new pool [here](https://kyve.network/gov/pools).
After you have created the pool, insert its ID, the amount of $KYVE you want to stake for this pool and your arweave
keyfile into the node config:

```ts
import KYVE from "@kyve/core";

const pool = 1;
const stake = 100
const jwk = ...

const node = new KYVE(myDataFetcher, myDataValidator, { pool, stake, jwk });
```

###### Running your node

To run your node, simply call the `.run()` function:

```ts
(async () => {
  await node.run();
})();
```
