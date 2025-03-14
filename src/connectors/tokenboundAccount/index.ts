import {
  Account,
  AccountInterface,
  num,
  ProviderInterface,
  ProviderOptions,
  RpcProvider,
  WalletAccount,
} from "starknet"

import {
  Permission,
  RequestFnCall,
  RpcMessage,
  RpcTypeToMessageMap,
} from "@starknet-io/types-js"
import {
  ConnectorNotConnectedError,
  ConnectorNotFoundError,
  UserRejectedRequestError,
} from "../../errors"
import { getStarknetChainId } from "../../helpers/getStarknetChainId"
import { resetWalletConnect } from "../../helpers/resetWalletConnect"
import {
  Connector,
  type ConnectorData,
  type ConnectorIcons,
} from "../connector"
import { DEFAULT_CHAIN_ID, TOKENBOUND_ACCOUNT_ICON } from "./constants"
import { openTokenboundModal } from "./helpers/openTokenboundwallet"
import { TBAStarknetWindowObject } from "./types/connector"
import Controller from "@cartridge/controller"
import { AccountChangeEventHandler } from "@starknet-io/get-starknet-core"
import { getSWOWithAccount } from "./connectWithAccount/getStarknetWindowObject"

interface PolicyOption {
  target: string
  method: string
  description: string
}

export interface TokenboundConnectorOptions {
  id: string
  chainId: string
  tbaAddress?: `0x${string}`
  account?: AccountInterface
  policies?: PolicyOption[] // if account is catridge
}

export class TokenboundConnector extends Connector {
  private _wallet: TBAStarknetWindowObject | null = null
  private _options: TokenboundConnectorOptions
  private _controller: Controller | null = null

  constructor(options: TokenboundConnectorOptions) {
    super()
    this._options = options
  }

  available(): boolean {
    return true
  }

  async ready(): Promise<boolean> {
    if (!this._wallet) {
      return false
    }

    try {
      const permissions = await this._wallet.request({
        type: "wallet_getPermissions",
      })

      return (permissions as Permission[]).includes(Permission.ACCOUNTS)
    } catch {
      return false
    }
  }

  get id(): string {
    return "TBA"
  }

  get name(): string {
    return "Tokenbound Account"
  }

  get icon(): ConnectorIcons {
    return {
      dark: TOKENBOUND_ACCOUNT_ICON,
      light: TOKENBOUND_ACCOUNT_ICON,
    }
  }

  get wallet(): TBAStarknetWindowObject {
    if (!this._wallet) {
      throw new ConnectorNotConnectedError()
    }

    return this._wallet
  }

  async connect(): Promise<ConnectorData> {
    await this.ensureWallet()

    if (!this._wallet) {
      throw new ConnectorNotFoundError()
    }
    const accounts = await this._wallet.request({
      type: "wallet_requestAccounts",
      params: { silent_mode: false },
    })

    const chainId = await this.chainId()
    return {
      account: accounts[0],
      chainId,
    }
  }

  async disconnect(): Promise<void> {
    resetWalletConnect()
    if (!this.available() && !this._wallet) {
      throw new ConnectorNotFoundError()
    }

    if (this._controller) {
      this._controller.disconnect()
    }
    this._wallet = null
  }

  async account(
    provider: ProviderOptions | ProviderInterface,
  ): Promise<AccountInterface> {
    if (!this._wallet) {
      throw new ConnectorNotConnectedError()
    }
    return new WalletAccount(provider, this._wallet)
  }

  async chainId(): Promise<bigint> {
    if (!this._wallet) {
      throw new ConnectorNotConnectedError()
    }

    const chainId = this._options.chainId
    const hexChainId = getStarknetChainId(chainId)
    return BigInt(hexChainId)
  }

  async request<T extends RpcMessage["type"]>(
    call: RequestFnCall<T>,
  ): Promise<RpcTypeToMessageMap[T]["result"]> {
    if (!this._wallet) {
      throw new ConnectorNotConnectedError()
    }

    try {
      return await this._wallet.request(call)
    } catch {
      throw new UserRejectedRequestError()
    }
  }
  async initEventListener(accountChangeCb: AccountChangeEventHandler) {
    if (!this._wallet) {
      throw new ConnectorNotConnectedError()
    }
    this._wallet.on("accountsChanged", accountChangeCb)
  }
  async removeEventListener(accountChangeCb: AccountChangeEventHandler) {
    if (!this._wallet) {
      throw new ConnectorNotConnectedError()
    }
    this._wallet.off("accountsChanged", accountChangeCb)
    this._wallet = null
  }

  private async ensureWallet(): Promise<void> {
    const { id, chainId, account, policies, tbaAddress } = this._options

    const formattedChainId = BigInt(getStarknetChainId(chainId))

    const address = tbaAddress ?? "0x"

    if (account) {

      const provider = new RpcProvider({
        nodeUrl: account?.channel.nodeUrl,
      })


      
      const formmatedAccount = new Account(provider, account.address, account.signer)

      const starknetWindowObject = await getSWOWithAccount({
        address,
        provider,
        account: formmatedAccount,
        chainId: num.toHex(formattedChainId),
        parentAccountId: id,
      })

      this._wallet = starknetWindowObject
    } else {
      const hexChainId = chainId
        ? BigInt(getStarknetChainId(chainId))
        : BigInt(getStarknetChainId(DEFAULT_CHAIN_ID))
      let _wallet =
        (await openTokenboundModal(hexChainId.toString(), policies)) ?? null
      if (!_wallet) return
      const { starknetWindowObject, controller } = _wallet
      if (starknetWindowObject) {
        this._wallet = starknetWindowObject
        this._controller = controller ?? null
      }
    }
  }
}
