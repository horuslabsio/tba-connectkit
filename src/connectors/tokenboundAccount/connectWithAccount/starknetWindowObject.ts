import type {
  AccountChangeEventHandler,
  NetworkChangeEventHandler,
  StarknetWindowObject,
  WalletEvents,
} from "@starknet-io/types-js"
import {
  Account,
  Call,
  CallData,
  constants,
  ProviderInterface,
  RawArgs,
  RpcProvider,
} from "starknet"
import { TBAStarknetWindowObject } from "../types/connector"
import { checkTbaVersion } from "../helpers/utils"

export const userEventHandlers: WalletEvents[] = []
export type Variant = "argentX" | "argentWebWallet" | "TBA"

export interface TBAStarknetWindowObjectOptions {
  id: Variant
  icon: string
  name: string
  version: string
  isConnected: boolean
  selectedAddress: string
  parentAccountId: string
  account: Account
  provider: RpcProvider
  chainId: string
}

export const getTokenboundSWOWithAccount = (
  options: TBAStarknetWindowObjectOptions,
  address: `0x${string}`,
): TBAStarknetWindowObject => {
  const { provider, account, chainId, parentAccountId } = options
  const wallet: TBAStarknetWindowObject = {
    ...options,
    async request(call) {
      switch (call.type) {
        case "wallet_requestAccounts": {
          try {
            await updateStarknetWindowObject(
              chainId,
              account,
              provider,
              parentAccountId,
              address,
              wallet,
            )

            return [address]
          } catch (error) {
            if (error instanceof Error) {
              throw new Error(error.message)
            }
            throw new Error("Unknown error on enable wallet")
          }
        }

        case "wallet_getPermissions": {
          throw new Error("not implemented")
        }

        case "wallet_requestChainId": {
          const chainId = await this.request({ type: "wallet_requestChainId" })
          return chainId as constants.StarknetChainId
        }

        default:
          throw new Error("not implemented")
      }
    },

    on: (event, handleEvent) => {
      if (event === "accountsChanged") {
        userEventHandlers.push({
          type: event,
          handler: handleEvent as AccountChangeEventHandler,
        })
      } else if (event === "networkChanged") {
        userEventHandlers.push({
          type: event,
          handler: handleEvent as NetworkChangeEventHandler,
        })
      } else {
        throw new Error(`Unknwown event: ${event}`)
      }
    },
    off: (event, handleEvent) => {
      if (event !== "accountsChanged" && event !== "networkChanged") {
        throw new Error(`Unknwown event: ${event}`)
      }

      const eventIndex = userEventHandlers.findIndex(
        (userEvent) =>
          userEvent.type === event && userEvent.handler === handleEvent,
      )

      if (eventIndex >= 0) {
        userEventHandlers.splice(eventIndex, 1)
      }
    },
  }
  return wallet
}

export async function updateStarknetWindowObject(
  chainId: string,
  account: Account,
  provider: RpcProvider,
  parentAccountId: string,
  tokenboundAddress: `0x${string}`,
  wallet: StarknetWindowObject,
): Promise<TBAStarknetWindowObject | null> {
  if (!account) {
    return null
  }
  const { id, name, version } = wallet
  const tbaVersion = await checkTbaVersion(provider, tokenboundAddress, chainId)
  const valuesToAssign: Pick<
    TBAStarknetWindowObject,
    | "id"
    | "name"
    | "icon"
    | "version"
    | "isConnected"
    | "chainId"
    | "selectedAddress"
    | "parentAccountId"
    | "parentAccount"
    | "account"
    | "provider"
  > = {
    id: id,
    name: name,
    icon: "light",
    version: version,
    isConnected: true,
    chainId,
    selectedAddress: tokenboundAddress,
    parentAccountId: parentAccountId,
    parentAccount: account.address,
    account: new TokenboundControllerAccount(
      provider,
      tokenboundAddress,
      tbaVersion ?? "",
      account,
    ),
    provider,
  }
  return Object.assign(wallet, valuesToAssign)
}

class TokenboundControllerAccount extends Account {
  constructor(
    provider: ProviderInterface,
    public address: `0x${string}`,
    public tbaVersion: string,
    public parentAccount: Account,
  ) {
    super(provider, address, parentAccount.signer)
  }
  override execute = async (calls: Call[]) => {
    try {
      const transactions = Array.isArray(calls) ? calls : [calls]

      const txns = transactions.map((call) => ({
        contractAddress: call.contractAddress,
        entrypoint: call.entrypoint,
        calldata:
          Array.isArray(call.calldata) && "__compiled__" in call.calldata
            ? call.calldata
            : CallData.compile(call.calldata as RawArgs),
      }))

      return await this.parentAccount.execute([
        {
          contractAddress: this.address,
          entrypoint: this.tbaVersion == "V2" ? "__execute__" : "execute",
          calldata: CallData.compile({ txns }),
        },
      ])
    } catch (error) {
      console.log(error)
      throw new Error("Error while executing a transaction")
    }
  }
}
