# Using Alchemy Smart Wallets with EIP-7702 to upgrade a Privy Embedded EOA

This is an example repository using Alchemy's Smart Wallet EIP-7702 support to upgrade an existing Privy embedded EOA. This enables features like gas sponsorship, batching, and more. This guide assumes you have already integrated with Privy and have existing embedded EOAs that you'd like to upgrade.

If you are looking for end-to-end embedded smart wallets for social login, gas sponsorship, batching and more, check out [Smart Wallets](https://www.alchemy.com/docs/wallets/).

Check out our [full guide](https://www.alchemy.com/docs/wallets/smart-contracts/modular-account-v2/using-7702) on using EIP-7702 to upgrade existing embedded EOAs with Alchemy Smart Wallets.

## Setup

1. Clone this repository and open it in your terminal. 
```sh
git clone https://github.com/avarobinson/alchemy-wallets-7702-thirdparty-example.git
```

2. Install the necessary dependencies with `npm`.
```sh
npm i 
```

3. Initialize your environment variables by copying the `.env.example` file to an `.env.local` file. Then, in `.env.local` paste
   - your [Alchemy API Key](https://dashboard.alchemy.com/apps)
   - you Alchemy [gas sponsorship policy ID](https://dashboard.alchemy.com/services/gas-manager/overview) (this is where you will define how you want to sponsor gas for your users)
   - your Privy App ID
```sh
# In your terminal, create .env.local from .env.example
cp .env.example .env.local
```

## Building locally

In your project directory, run `npm run dev`. You can now visit http://localhost:3000 to see your app. 

Login with socials, delegate your embedded EOA to a smart account, and send a sponsored transaction from your EOA!

**Check out [our docs](https://accountkit.alchemy.com/react/using-7702) for more guidance around using EIP-7702 with smart wallets!**
