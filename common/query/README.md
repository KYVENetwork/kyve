## Installation

```
yarn add @kyve/query
```

## Usage

Note: The KYVE-Query class extends ArDB. For detailed information
please refer to the [documentation](https://github.com/cedriking/ardb).

### Querying

#### Basic Query

To query KYVE data, create a new Query and pass in the poolID. The default limit is
10 transactions. Call `.next()` to get to the next page. The default order is latest -> oldest transactions.

```ts
import { Query } from "@kyve/query";

const poolID = 0;
const query = new Query(poolID);

// finding latest transactions
const txs = query.find();

// receiveing the next 10 results
const nextTxs = query.next();
```

#### Setting custom limits

To set a custom limit you can add a `.limit()` statement.

```ts
// finding 50 latest transactions
const txs = query.limit(50).find();
```

#### Other filters

For other filters please refer to the ArDB [documentation](https://github.com/cedriking/ardb).
