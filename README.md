
# IDONK – Decentralized Knowledge Verification Platform
**"You know what I don't know."**

![Screenshot of IDONK – Decentralized Knowledge Verification Platform](https://github.com/user-attachments/assets/7b33b537-2d83-4a3e-9de0-1408bd31fcb0)

**IDONK** aims to address misinformation by offering a decentralized platform where users can post, validate, and authenticate knowledge. By leveraging blockchain technology and a staking mechanism, the platform ensures that only verified, authentic information is rewarded and preserved, creating a trustworthy library. Users are incentivized through the IDONK token to actively participate in communities, vote on the accuracy of ideas, and contribute knowledge.

### Repository Overview:
This repository contains all the smart contracts related to this project:

- **Communities**: Handles computations for manipulating and viewing concepts related to the community platform.
- **Connector**: The major view function, connecting to other contracts via Interface Call to create a safe view platform.
- **ContentConnector**: A safe contract used for users to submit their content or ideas.
- **ContentWork**: The raw contract dealing with content submission and manipulation (unsafe).
- **CustomERC20**: Manages the IDONK token.
- **Reward**: Contract used for claiming rewards from content.
- **SafeUserRegistration**: Ensures safe user registration.
- **UserMetadata**: Manages, stores, and retrieves users' unique names and metadata.
- **UserProfiles**: (Unsafe) Contract managing system state data of users.
- **Voters**: (Unsafe) Contract managing voting, redirection, and laws regarding voting.
- **VotingConnector**: A safe contract that gets the stake and votes of users concerning content.

![Communities Overview](https://github.com/user-attachments/assets/dfd8b3ea-96bc-4bef-9a27-92cbcbd26088)

---


To set up more minimal example that still uses the Stylus SDK, use `cargo stylus new --minimal <YOUR_PROJECT_NAME>` under [OffchainLabs/cargo-stylus](https://github.com/OffchainLabs/cargo-stylus).

## Quick Start 

Install [Rust](https://www.rust-lang.org/tools/install), and then install the Stylus CLI tool with Cargo

```bash
cargo install --force cargo-stylus cargo-stylus-check
```

Add the `wasm32-unknown-unknown` build target to your Rust compiler:

```
rustup target add wasm32-unknown-unknown
```

You should now have it available as a Cargo subcommand:

```bash
cargo stylus --help
```

Then, clone the template:

```
git clone https://github.com/steven3002/IDONK_Smart_Contract_-_Front-End.git
```

### Testnet Information

All testnet information, including faucets and RPC endpoints can be found [here](https://docs.arbitrum.io/stylus/reference/testnet-information).

### ABI Export

You can export the Solidity ABI for your program by using the `cargo stylus` tool as follows:

```bash
cargo stylus export-abi
```


Exporting ABIs uses a feature that is enabled by default in your Cargo.toml:

```toml
[features]
export-abi = ["stylus-sdk/export-abi"]
```

## Deploying

You can use the `cargo stylus` command to also deploy your program to the Stylus testnet. We can use the tool to first check
our program compiles to valid WASM for Stylus and will succeed a deployment onchain without transacting. By default, this will use the Stylus testnet public RPC endpoint. See here for [Stylus testnet information](https://docs.arbitrum.io/stylus/reference/testnet-information)

```bash
cargo stylus check
```

If successful, you should see:

```bash
Finished release [optimized] target(s) in 1.88s
Reading WASM file at stylus-hello-world/target/wasm32-unknown-unknown/release/stylus-hello-world.wasm
Compressed WASM size: 8.9 KB
Program succeeded Stylus onchain activation checks with Stylus version: 1
```

Next, we can estimate the gas costs to deploy and activate our program before we send our transaction. Check out the [cargo-stylus](https://github.com/OffchainLabs/cargo-stylus) README to see the different wallet options for this step:

```bash
cargo stylus deploy \
  --private-key-path=<PRIVKEY_FILE_PATH> \
  --estimate-gas
```

You will then see the estimated gas cost for deploying before transacting:

```bash
Deploying program to address e43a32b54e48c7ec0d3d9ed2d628783c23d65020
Estimated gas for deployment: 1874876
```

The above only estimates gas for the deployment tx by default. To estimate gas for activation, first deploy your program using `--mode=deploy-only`, and then run `cargo stylus deploy` with the `--estimate-gas` flag, `--mode=activate-only`, and specify `--activate-program-address`.


Here's how to deploy:

```bash
cargo stylus deploy \
  --private-key-path=<PRIVKEY_FILE_PATH>
```

The CLI will send 2 transactions to deploy and activate your program onchain.

```bash
Compressed WASM size: 8.9 KB
Deploying program to address 0x457b1ba688e9854bdbed2f473f7510c476a3da09
Estimated gas: 1973450
Submitting tx...
Confirmed tx 0x42db…7311, gas used 1973450
Activating program at address 0x457b1ba688e9854bdbed2f473f7510c476a3da09
Estimated gas: 14044638
Submitting tx...
Confirmed tx 0x0bdb…3307, gas used 14044638
```

Once both steps are successful, you can interact with your program as you would with any Ethereum smart contract.

Before running, set the following env vars or place them in a `.env` file (see: [.env.example](./.env.example)) in this project:

```
RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
STYLUS_CONTRACT_ADDRESS=<the onchain address of your deployed program>
PRIV_KEY_PATH=<the file path for your priv key to transact with>
```

Next, run:

```
cargo run --example counter --target=<YOUR_ARCHITECTURE>
```

Where you can find `YOUR_ARCHITECTURE` by running `rustc -vV | grep host`. For M1 Apple computers, for example, this is `aarch64-apple-darwin` and for most Linux x86 it is `x86_64-unknown-linux-gnu`

## Build Options

By default, the cargo stylus tool will build your project for WASM using sensible optimizations, but you can control how this gets compiled by seeing the full README for [cargo stylus](https://github.com/OffchainLabs/cargo-stylus). If you wish to optimize the size of your compiled WASM, see the different options available [here](https://github.com/OffchainLabs/cargo-stylus/blob/main/OPTIMIZING_BINARIES.md).

## Peeking Under the Hood

The [stylus-sdk](https://github.com/OffchainLabs/stylus-sdk-rs) contains many features for writing Stylus programs in Rust. It also provides helpful macros to make the experience for Solidity developers easier. These macros expand your code into pure Rust code that can then be compiled to WASM. If you want to see what the `stylus-hello-world` boilerplate expands into, you can use `cargo expand` to see the pure Rust code that will be deployed onchain.

First, run `cargo install cargo-expand` if you don't have the subcommand already, then:

```
cargo expand --all-features --release --target=<YOUR_ARCHITECTURE>
```

Where you can find `YOUR_ARCHITECTURE` by running `rustc -vV | grep host`. For M1 Apple computers, for example, this is `aarch64-apple-darwin`.

## License

This project is fully open source, including an Apache-2.0 or MIT license at your choosing under your own copyright.
