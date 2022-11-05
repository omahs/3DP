import axios from "axios";
import { Account, sequelize } from "./lib/models.js";
import { decodeAddress } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";

const budget_wallet = "0x5cd72016c1335a392ada6bb54da41493583f1101ee4d63941ec42c30a77bbd38";
const endpoint = "https://explorer-api.3dpass.org/graphql/";
const headers = {
  "Content-Type": "application/json",
  Accept: "application/json",
};
const query = `
  query GetTransfers($accountId: String!) {
    getTransfers(
      pageSize: 100
      pageKey: "1"
      filters: {
        or: [
          { fromMultiAddressAccountId: $accountId }
          { toMultiAddressAccountId: $accountId }
        ]
      }
    ) {
      pageInfo {
        pageSize
        pageNext
      }
      objects {
        blockNumber
        extrinsicIdx
        fromMultiAddressAccountId
        toMultiAddressAccountId
        value
        blockDatetime
        complete
      }
    }
  }
`;
const graphqlQuery = {
  query,
  variables: {},
};

await sequelize.sync();
const accounts = await Account.findAll({
  where: {
    is_received: false,
  },
  order: [["amount", "ASC"]],
});

// for each account check if the transfer is complete
for (const account of accounts) {
  graphqlQuery.variables.accountId = u8aToHex(decodeAddress(account.address));
  const response = await axios({
    url: endpoint,
    method: "post",
    headers: headers,
    data: graphqlQuery,
  });
  const { objects } = response.data.data.getTransfers;
  let received = false;
  if (objects.length > 0) {
    for (const object of objects) {
      if (
        object.fromMultiAddressAccountId === budget_wallet &&
        object.value === account.amount &&
        object.complete === true
      ) {
        account.is_received = true;
        await account.save();
        console.log(`✅ ${account.address} ${account.amount}`);
        received = true;
        break;
      }
    }
  }
  if (!received) {
    console.log(`❌ ${account.address} ${account.amount}`);
  }
}
