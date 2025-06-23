import type { GetWalletOptions } from "@starknet-io/get-starknet-core"
import type {
  ConnectorData,
  ConnectorIcons,
  StarknetkitConnector,
} from "../connectors/connector"
import { TokenboundConnectorOptions } from "src/connectors"
import { TBAStarknetWindowObject } from "src/main"
import { AccountInterface, constants } from "starknet"


export type StoreVersion = "chrome" | "firefox" | "edge"

export interface ConnectOptions extends GetWalletOptions {
  dappName?: string
  modalMode?: "alwaysAsk" | "canAsk" | "neverAsk"
  modalTheme?: "light" | "dark" | "system"
  storeVersion?: StoreVersion | null
  resultType?: "connector" | "wallet"
  tokenboundOptions: TokenboundConnectorOptions
}

export interface ConnectOptionsWithConnectors
  extends Omit<
    ConnectOptions,
    "webWalletUrl" | "argentMobileOptions | tokenboundOptions"
  > {
  connectors?: StarknetkitConnector[]
}

export interface ConnectWithColonizOptions {
  chainId: constants.StarknetChainId
}

export type ModalWallet = {
  name: string
  id: string
  icon: ConnectorIcons
  download?: string
  subtitle?: string
  title?: string
  connector: StarknetkitConnector
}

export type ModalResult = {
  connector: StarknetkitConnector | null
  connectorData: ConnectorData | null
  wallet?: TBAStarknetWindowObject | null
}

export type ColonizResult = {
  isConnected: boolean;
  access_token: string
  profile: ColonizProfile | null
  account: AccountInterface
}

export type ColonizProfile = {
  id: string
  displayName: string
  handle: string
  profileAddress: `0x${string}`
  bio: string
  email: string
}
