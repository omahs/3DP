import { ApiPromise, WsProvider } from "@polkadot/api";
import { encodeAddress } from "@polkadot/util-crypto";
import cliProgress from "cli-progress";
import { Account, sequelize } from "./lib/models.js";
import { bigIntMin } from "./lib/utils.js";
import { provider_test, RPC_TYPES, ss58Format } from "./lib/config.js";

const ignored = [
  "d7etuFnyFAAZTVbeqqsFoH5Ff6L2m1CFSUbkAncRijFhrHDqm", // budget
  "d1GWgiJKSZYawVqm9snxH7QETjGswVTx8QQHmQsGT6XeeGDww",
  "d7dQe96fmoKuRX1ap7x5jNW161YtzLmm96zvdpG6HdfQAy7kG", // investors
  "d1F2Rbc1yChvuXFh89snDCpyteVkAq3Tq2oUESWw1zwLxxRgc",
  "d7b6PWkynfechps4xKCkGTB5cmXPxuVxUbJzdf2eKZseBqt4K", // team
  "d1CiAyGKz52eBq7BGM8SkHW4RQUF9PmfAX7YEHHV3w9ayqGKT",
  "d7gLPo9TCE1yjzBXKtWJ5tEhf4fvKcniyWTSfGNqgM52fio8L", // team
  "d1HxBFeoPdQ1DzRddvRzZiZgThcmW74RfSFzFtdgQiLyTiFUB",
  "d7dagHHh5yfq5eujfoMKJzhrZ73dKd6TwxtdmokZQ8uiZLPeb", // team
  "d1FCTjo3HP3rZf9qyqH1nq2qMjzUW7NAdthBNS1Q8WBfMKnKK",
];

async function getBalancesAtBlock(api, blockNumber) {
  const balancesAtBlock = {};
  const hash = await api.rpc.chain.getBlockHash(blockNumber);
  const blockApi = await api.at(hash);

  const limit = 100;
  let last_key = "";

  while (true) {
    let query = await blockApi.query.system.account.entriesPaged({
      args: [],
      pageSize: limit,
      startKey: last_key,
    });

    if (query.length === 0) {
      break;
    }

    for (const user of query) {
      const account_id = encodeAddress(user[0].slice(-32), ss58Format);
      if (ignored.includes(account_id)) {
        continue;
      }
      const free_balance = user[1].data.free.toBigInt();
      const reserved_balance = user[1].data.reserved.toBigInt();
      balancesAtBlock[account_id] = free_balance - reserved_balance;
      last_key = user[0];
    }
  }
  return balancesAtBlock;
}

function transferFunds(balances, data) {
  const [from, to, amount] = data;
  const [fromAddress, toAddress] = [encodeAddress(from, ss58Format), encodeAddress(to, ss58Format)];

  if (!balances.hasOwnProperty(fromAddress)) {
    balances[fromAddress] = BigInt(0);
  }
  if (!balances.hasOwnProperty(toAddress)) {
    balances[toAddress] = BigInt(0);
  }

  const transferAmount = bigIntMin(balances[fromAddress], amount.toBigInt());
  balances[fromAddress] -= transferAmount;
  balances[toAddress] += transferAmount;
}

const api = await ApiPromise.create({
  provider: new WsProvider(provider_test),
  types: RPC_TYPES,
});

const [chain, syncState, nodeName, nodeVersion] = await Promise.all([
  api.rpc.system.chain(),
  api.rpc.system.syncState(),
  api.rpc.system.name(),
  api.rpc.system.version(),
]);
console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);

const miningLockedAt = 106390;
const minBlock = miningLockedAt + 1;
const maxBlock = 144479;

const balances = await getBalancesAtBlock(api, miningLockedAt);

const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
bar.start(maxBlock - minBlock, 0);

let blockNumber = minBlock;
while (blockNumber < maxBlock) {
  const hash = await api.rpc.chain.getBlockHash(blockNumber++);
  const blockApi = await api.at(hash);

  try {
    const events = await blockApi.query.system.events();
    events.forEach(({ event: { data, method, section } }) => {
      if (section === "balances" && method === "Transfer") {
        transferFunds(balances, data);
      }
    });
  } catch (e) {
    console.log(`Error @ block ${blockNumber} :: ${e}`);
  }
  bar.update(blockNumber - minBlock);
}

await sequelize.sync();
await Account.bulkCreate(
  Object.entries(balances).map(([address, amount]) => ({ address, amount })),
  { updateOnDuplicate: ["amount"] }
);

const totalBalance = Object.values(balances).reduce((acc, cur) => acc + cur, BigInt(0));
console.log(`Total balance: ${totalBalance}`);
