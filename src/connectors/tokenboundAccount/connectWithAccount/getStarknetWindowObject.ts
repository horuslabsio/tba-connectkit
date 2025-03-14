import { Account, RpcProvider } from "starknet"
import { TOKENBOUND_ACCOUNT_ICON } from "../constants"
import { TBAStarknetWindowObject } from "../types/connector"
import { getTokenboundSWOWithAccount } from "./starknetWindowObject"

interface Options {
  address: `0x${string}`
  account: Account
  provider: RpcProvider
  chainId: string
  parentAccountId: string
}

export const getSWOWithAccount = async ({
  address,
  account,
  provider,
  chainId,
  parentAccountId,
}: Options): Promise<TBAStarknetWindowObject> => {
  const globalWindow = typeof window !== "undefined" ? window : undefined

  if (!globalWindow) {
    throw new Error("window is not defined")
  }
  const starknetWindowObject = getTokenboundSWOWithAccount(
    {
      id: "TBA",
      icon: TOKENBOUND_ACCOUNT_ICON,
      name: "Tokenbound Account",
      version: "1.0.0",
      isConnected: false,
      selectedAddress: "",
      parentAccountId,
      chainId,
      account,
      provider,
    },
    address,
  )
  return starknetWindowObject
}
