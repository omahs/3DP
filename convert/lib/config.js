import { WsProvider } from "@polkadot/api";

export const RPC_TYPES = {
  AccountInfo: "AccountInfoWithTripleRefCount",
  Address: "AccountId",
  LookupSource: "AccountId",
  Keys: "SessionKeys2",
  // Weight: "u32",
  Difficulty: "u256",
  DifficultyAndTimestamp: {
    difficulty: "Difficulty",
    timestamp: "u64",
  },
  LockParameters: {
    period: "u16",
    divide: "u16",
  },
  StorageVersion: {
    _enum: ["V0", "V1"],
    V0: "u8",
    V1: "u8",
  },
};
// main net ss58 format
export const ss58Format = 71;

// target/release/poscan-consensus --base-path ~/3dp-chains/test --chain testnetSpecRaw.json --no-prometheus --no-mdns --rpc-cors all --pruning=archive
export const provider_test = new WsProvider("ws://127.0.0.1:9944");

// target/release/poscan-consensus --base-path ~/3dp-chains/main --chain mainnetSpecRaw.json --no-prometheus --no-mdns --rpc-cors all --ws-port 9945
export const provider_main = new WsProvider("ws://127.0.0.1:9945");
