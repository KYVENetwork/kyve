# KYVE Node

## Getting Started

### Clone the repository and install dependencies

1.  Clone the repository

    ```
    git clone https://github.com/KYVENetwork/kyve.git
    ```

2.  Install and link dependencies

    ```
    yarn setup
    ```

3.  Switch into the node folder
    ```
    cd integrations/node
    ```

### Create a config.json

```
touch config.json
```

Inside your `config.json` you need to specify the pool id with the amount of tokens you want to stake per pool.
Your config should look like this:

```json
{
  "pools": {
    "0": 1,
    "2": 10
    // add further pool ids here
  }
}
```

In the example above, your node would stake 1 $KYVE token in pool with ID 0 and 10 tokens in pool with ID 2.
You can find a list of available pools [here](https://kyve.network/gov/pools). If your account does not have enough tokens to stake in the pool,
the process for the pool will fail.

### Copy your arweave key file

If you don't have an Arweave key file yet, you can create or claim one [here](https://arweave.org).
We recommend renaming your key file into `arweave.json` as it is automatically covered
by the gitignore. Please make sure, that your wallet has a sufficient amount of AR to take part in validation or uploading.
You also need $KYVE tokens to run the node. You can get $KYVE tokens [here](https://kyve.network/gov/tokens).
While KYVE is running as a testnet, you can claim free tokens [here](https://kyve.network/gov/tokens).

### Create a `.env`-File

Create your `.env` file and add the following

```
CONFIG=config.json
WALLET=arweave.json
```

_Note: If your keyfile or config-file have different names, change them
accordingly_

## Running the node

### Using Docker (recommended)

#### Build the Dockerfile

```
yarn node:build
```

or

```
docker build -t kyve-node:latest .
```

#### Run the node

```
yarn node:run
```

or

```
docker run --name kyve-node kyve-node:latest
```

### Using NodeJS

To run the KYVE node using NodeJS simply,
start the script:

```
yarn start
```
