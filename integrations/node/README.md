# KYVE Node

## Getting Started

### Clone the repository

```
git clone https://github.com/KYVENetwork/node.git
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
  }
}
```

In the example above, your node would stake 1 KYVE tokens in pool with ID 0 and 10 tokens in pool with ID 2.
For a list of available pools, please refer to [tbd]. If your account does not have enough tokens to stake in the pool,
you won't participate in the pool.

### Copy your arweave key file

If you don't have an Arweave key file yet, you can create or claim one here [insert link].
We recommend renaming your key file into `arweave.json` as it is automatically covered
by the gitignore. Please make sure, that your wallet has a sufficient amount of AR to take part in validation or uploading.
You also need KYVE tokens to run the node. You can get KYVE tokens here [link to verto].
While KYVE is running as a testnet, you can claim free tokens here: [link to dispense]

### Create a `.env`-File

Create your `.env` file and add the following

```
CONFIG=config.json
WALLET=arweave.json
```

## Running the node

### Using Docker (recommended)

#### Build the Dockerfile

```
docker build -t kyve-node:latest .
```

#### Run the node

```
docker run --name kyve-node kyve-node:latest
```

### Using NodeJS

To run the KYVE node using NodeJS simply,
install the dependencies:

```
yarn install
```

build the code:

```
yarn build
```

and start it:

```
yarn start
```
