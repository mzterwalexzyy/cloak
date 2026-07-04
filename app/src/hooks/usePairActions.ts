import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import type { TokenWrapperPairWithMetadata } from "@zama-fhe/sdk";
import { toBaseUnits } from "../lib/format";
import type { ZamaSdkHandle } from "./useZamaSdk";

export type TxState = { status: "idle" | "pending" | "ok" | "error"; msg?: string; hash?: string };
const idle: TxState = { status: "idle" };

const ERC20_BALANCE_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function txHash(res: unknown): string | undefined {
  if (res && typeof res === "object") {
    const r = res as Record<string, unknown>;
    const h = r.txHash ?? r.hash ?? r.transactionHash;
    if (typeof h === "string") return h;
  }
  return undefined;
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message.length > 180 ? e.message.slice(0, 177) + "…" : e.message;
  return String(e);
}

/** All wrap / unwrap / send / decrypt state + handlers for a single pair. */
export function usePairActions(pair: TokenWrapperPairWithMetadata, zama: ZamaSdkHandle) {
  const { address } = useAccount();
  const u = pair.underlying;
  const c = pair.confidential;

  const { data: underlyingBal, refetch: refetchUnderlying } = useReadContract({
    address: pair.tokenAddress,
    abi: ERC20_BALANCE_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const [bal, setBal] = useState<{ loading: boolean; value?: bigint; error?: string; msg?: string }>({ loading: false });
  async function decryptBalance() {
    if (!address) {
      setBal({ loading: false, error: "Connect your wallet on Sepolia first." });
      return;
    }
    setBal({ loading: true, msg: "Requesting wallet authorization…" });
    try {
      const sdk = zama.getSdk();
      // Revoke the local permit for this token so the demo path asks the wallet
      // for a fresh EIP-712 authorization instead of silently reusing a cached one.
      await sdk.permits.revokePermits([pair.confidentialTokenAddress]);
      setBal({ loading: true, msg: "Decrypting encrypted balance…" });
      const token = sdk.createToken(pair.confidentialTokenAddress);
      setBal({ loading: false, value: await token.balanceOf(address) });
    } catch (e) {
      setBal({ loading: false, error: errMsg(e) });
    }
  }

  const [wrapAmt, setWrapAmt] = useState("");
  const [wrapTx, setWrapTx] = useState<TxState>(idle);
  async function doWrap() {
    setWrapTx({ status: "pending", msg: "Preparing… approve the request(s) in your wallet" });
    try {
      const wt = zama.getSdk().createWrappedToken(pair.confidentialTokenAddress);
      const res = await wt.shield(toBaseUnits(wrapAmt, u.decimals));
      setWrapTx({ status: "ok", msg: "Wrapped ✓", hash: txHash(res) });
      setWrapAmt("");
      setBal({ loading: false });
      refetchUnderlying();
    } catch (e) {
      setWrapTx({ status: "error", msg: errMsg(e) });
    }
  }

  const [unwrapAmt, setUnwrapAmt] = useState("");
  const [unwrapTx, setUnwrapTx] = useState<TxState>(idle);
  async function doUnwrap(all: boolean) {
    setUnwrapTx({ status: "pending", msg: "Unwrapping…" });
    try {
      const wt = zama.getSdk().createWrappedToken(pair.confidentialTokenAddress);
      const res = all ? await wt.unshieldAll() : await wt.unshield(toBaseUnits(unwrapAmt, c.decimals));
      setUnwrapTx({ status: "ok", msg: "Unwrapped ✓", hash: txHash(res) });
      setUnwrapAmt("");
      setBal({ loading: false });
      refetchUnderlying();
    } catch (e) {
      setUnwrapTx({ status: "error", msg: errMsg(e) });
    }
  }

  const [sendTo, setSendTo] = useState("");
  const [sendAmt, setSendAmt] = useState("");
  const [sendTx, setSendTx] = useState<TxState>(idle);
  async function doSend(isAddressValid: boolean) {
    if (!isAddressValid) {
      setSendTx({ status: "error", msg: "Enter a valid recipient address (0x…)" });
      return;
    }
    setSendTx({ status: "pending", msg: "Encrypting amount & sending… approve in your wallet" });
    try {
      const token = zama.getSdk().createToken(pair.confidentialTokenAddress);
      const res = await token.confidentialTransfer(sendTo as `0x${string}`, toBaseUnits(sendAmt, c.decimals));
      setSendTx({ status: "ok", msg: "Sent confidentially ✓ — amount hidden on-chain", hash: txHash(res) });
      setSendAmt("");
      setBal({ loading: false });
    } catch (e) {
      setSendTx({ status: "error", msg: errMsg(e) });
    }
  }

  function clearBalance() {
    setBal({ loading: false });
  }

  return {
    u, c,
    underlyingBal: underlyingBal as bigint | undefined,
    refetchUnderlying,
    bal, decryptBalance, clearBalance,
    wrapAmt, setWrapAmt, wrapTx, doWrap,
    unwrapAmt, setUnwrapAmt, unwrapTx, doUnwrap,
    sendTo, setSendTo, sendAmt, setSendAmt, sendTx, doSend,
  };
}
