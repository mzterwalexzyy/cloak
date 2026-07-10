/** CloakDisperse V2 — batch single-tx confidential disperse contract. */

/** Set to the deployed contract address after deployment. */
export const CLOAK_DISPERSE_ADDRESS: string = "PENDING_DEPLOY";

export const CLOAK_DISPERSE_ABI = [
  {
    type: "function",
    name: "disperseConfidential",
    inputs: [
      { name: "token",            type: "address",   internalType: "address" },
      { name: "from",             type: "address",   internalType: "address" },
      { name: "recipients",       type: "address[]", internalType: "address[]" },
      { name: "encryptedAmounts", type: "bytes32[]", internalType: "bytes32[]" },
      { name: "inputProof",       type: "bytes",     internalType: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "BatchDisperseCompleted",
    inputs: [
      { name: "token",          type: "address", indexed: true },
      { name: "from",           type: "address", indexed: true },
      { name: "recipientCount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "error",
    name: "LengthMismatch",
    inputs: [],
  },
  {
    type: "error",
    name: "NoRecipients",
    inputs: [],
  },
  {
    type: "error",
    name: "OnlySenderCanDisperse",
    inputs: [],
  },
] as const;

export const SET_OPERATOR_ABI = [
  {
    type: "function",
    name: "setOperator",
    inputs: [
      { name: "operator", type: "address", internalType: "address" },
      { name: "until",    type: "uint48",  internalType: "uint48"  },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export const IS_OPERATOR_ABI = [
  {
    type: "function",
    name: "isOperator",
    inputs: [
      { name: "owner",    type: "address", internalType: "address" },
      { name: "operator", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
] as const;

/** uint48 max — approves the operator indefinitely. */
export const OPERATOR_UNTIL_MAX = 281474976710655;
