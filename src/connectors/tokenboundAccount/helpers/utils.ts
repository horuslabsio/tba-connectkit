import { num, Provider, RpcProvider, WalletAccount } from "starknet"
import {
  AccountClassHashes,
  MAINNET_NODE_URL,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_NODE_URL,
  UserRejectedRequestError,
} from "../constants"
import {
  TBAChainID,
  TBAVersion,
  TokenboundClient,
} from "starknet-tokenbound-sdk"
import { GetClassHashError, GetTBAOwnerError } from "../../../errors"
import { version } from "os"
// import sn from "@starknet-io/get-starknet-core"

export async function getTokenBoundClassHash(
  provider: Provider,
  tokenboundAddress: string,
): Promise<string> {
  try {
    const tbaClassHash = await provider.getClassHashAt(tokenboundAddress)
    return tbaClassHash
  } catch (e) {
    console.error(e)
    throw new GetClassHashError()
  }
}

export default async function hasAccountOwnership(
  chainId: string,
  tokenboundAddress: string,
  provider: RpcProvider,
  parentAccountAddress?: string,
): Promise<boolean> {
  if (!tokenboundAddress && !parentAccountAddress) return false
  const NODE_URL =
    num.toHex(chainId) === SEPOLIA_CHAIN_ID
      ? SEPOLIA_NODE_URL
      : MAINNET_NODE_URL

  const tbaClassHash = await getTokenBoundClassHash(provider, tokenboundAddress)
  if (!tbaClassHash) return false

  const network =
    num.toHex(chainId) === SEPOLIA_CHAIN_ID ? "sepolia" : "mainnet"
    
  const options = {
    walletClient: { address: "", privateKey: "" },
    chain_id: network === "sepolia" ? TBAChainID.sepolia : TBAChainID.main,
    implementationAddress: tbaClassHash,
    version: TBAVersion.V3,
    jsonRPC: NODE_URL,
  }
  const tokenbound = new TokenboundClient(options)
  try {
    const owner = await tokenbound.getOwner({ tbaAddress: tokenboundAddress })
    const account = num.toHex(owner)
    const formatedParentAddress = num.toHex(parentAccountAddress ?? "")
    if (account && formatedParentAddress) {
      return account === formatedParentAddress
    }
    return false
  } catch (e) {
    throw new GetTBAOwnerError()
  }
}

export async function waitForWalletAccountAddress(
  walletAccount: WalletAccount,
  delay = 500,
  maxWaitTime = 120000,
): Promise<void> {
  const startTime = Date.now()

  async function checkAddress() {
    if (walletAccount.address !== "") return

    if (Date.now() - startTime >= maxWaitTime) {
      throw new Error("Timeout: walletAccount.address did not populate in time")
    }
    await new Promise((resolve) => setTimeout(resolve, delay))
    return checkAddress()
  }
  return checkAddress()
}

export async function checkTbaVersion(
  provider: RpcProvider,
  tokenboundAddress: string,
  chainId: string,
): Promise<string> {
  try {
    if (!provider || !tokenboundAddress) return ""
    const tbaClassHash = await getTokenBoundClassHash(
      provider,
      tokenboundAddress,
    )
    if (!tbaClassHash) return ""
    const network =
      num.toHex(chainId) === SEPOLIA_CHAIN_ID ? "sepolia" : "mainnet"
    const implementationAddresses = {
      [TBAVersion.V2]:
        AccountClassHashes.V2[network as keyof typeof AccountClassHashes.V2],
      [TBAVersion.V3]:
        AccountClassHashes.V3[network as keyof typeof AccountClassHashes.V3],
    }

    let version: (typeof TBAVersion)[keyof typeof TBAVersion] | string = ""

    for (const [ver, impl] of Object.entries(implementationAddresses)) {
      if (tbaClassHash === impl) {
        version = ver as (typeof TBAVersion)[keyof typeof TBAVersion]
        return version
      }
    }
    return version
  } catch (e) {
    throw new UserRejectedRequestError()
  }
}
