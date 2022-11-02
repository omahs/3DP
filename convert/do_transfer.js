import { Account, sequelize } from "./lib/models.js";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import keyring from "@polkadot/ui-keyring";
import { provider_main, RPC_TYPES, ss58Format } from "./lib/config.js";
import { ApiPromise, WsProvider } from "@polkadot/api";

const limit = 1;
const mnemonic = "";

async function main() {
  await cryptoWaitReady();
  await keyring.loadAll({ ss58Format, type: "sr25519" });

  const pair = keyring.createFromUri(mnemonic);
  console.log(`🔑 ${pair.address}`);

  const api = await ApiPromise.create({
    provider: new WsProvider(provider_main),
    types: RPC_TYPES,
  });

  const balance = await api.query.system.account(pair.address);
  console.log(`💰 ${balance.data.free.toHuman()}`);

  await sequelize.sync();
  const accounts = await Account.findAll({
    where: {
      transfer_hash: null,
    },
    order: [["amount", "ASC"]],
  });

  const accounts_count = accounts.length;
  console.log(`🔎 ${accounts_count} accounts to transfer`);

  let count = 0;
  for (const account of accounts) {
    console.log(`${account.address} ➡️  ${account.amount}`);
    try {
      const transfer = await api.tx.balances.transfer(account.address, BigInt(account.amount));
      const hash = await transfer.signAndSend(pair);
      account.transfer_hash = hash.toHex();
      console.log("✅ Transfer sent with hash", account.transfer_hash);
      await account.save();
    } catch (e) {
      console.log(`Error: ${e}`);
    }
    if (++count >= limit) {
      break;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(-1);
  });
