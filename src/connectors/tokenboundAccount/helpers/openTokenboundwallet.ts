import { getTokenboundAccountStarknetObject } from "../starknetWindowObject/getTokenboundWalletStarknetObject"
import { openWebwallet } from "../webwallet/helpers/openWebwallet"
import { TBAStarknetWindowObject } from "../types/connector"
import { DEFAULT_WEBWALLET_URL, SEPOLIA_CHAIN_ID } from "../constants"
import { Account, AccountInterface, num, RpcProvider } from "starknet"
import ControllerModal from "../../../modal/Controller.svelte"
import TokenboundModal from "../../../modal/TokenboundModal.svelte"
import css from "../../../theme.css?inline"
import { getTokenboundAccountController } from "../controller/getControllerStarknetWindowObject"
import Controller, {  } from "@cartridge/controller"
import { setPopupOptions } from "../webwallet/helpers/trpc"

export const getTarget = (): ShadowRoot => {
  const modalId = "controller-modal-container"
  const existingElement = document.getElementById(modalId)

  if (existingElement) {
    if (existingElement.shadowRoot) {
      return existingElement.shadowRoot
    }
    existingElement.remove()
  }
  const element = document.createElement("div")
  element.id = modalId
  document.body.appendChild(element)
  const target = element.attachShadow({ mode: "open" })
  return target
}

const TokenboundModalTarget = (): ShadowRoot => {
  const modalId = "tokenbound-modal-container"
  const existingElement = document.getElementById(modalId)
  if (existingElement) {
    if (existingElement.shadowRoot) {
      return existingElement.shadowRoot
    }
    existingElement.remove()
  }
  const element = document.createElement("div")
  element.id = modalId
  document.body.appendChild(element)
  const target = element.attachShadow({ mode: "open" })
  target.innerHTML = `<style>${css}</style>`

  return target
}

export const openTokenboundModal = async (
  chainId: string,
  policies?: string[],
): Promise<
  | { starknetWindowObject?: TBAStarknetWindowObject; controller?: Controller }
  | undefined
> => {
  return new Promise<
    | {
        starknetWindowObject?: TBAStarknetWindowObject
        controller?: Controller
      }
    | undefined
  >((resolve) => {
    const modal = new TokenboundModal({
      target: TokenboundModalTarget(),
      props: {
        closeModal: () => {
          modal.$destroy()
        },

        callback: async (options: {
          address: string
          parentWallet: string
        }) => {
          const { address, parentWallet } = options

          if (!parentWallet || !address) {
            throw new Error("parent wallet or address is empty")
          }
          const wallet_id = parentWallet.toLowerCase()
          const globalObject: Record<string, any> = globalThis
          let wallet: TBAStarknetWindowObject | undefined

          try {
            // Check wallet type and instantiate wallet accordingly
            if (wallet_id === "braavos" || wallet_id === "argentx") {
              wallet =
                globalObject[
                  `starknet_${wallet_id === "argentx" ? "argentX" : wallet_id}`
                ]
            }

            // Argent web wallet
            else if (wallet_id === "argentwebwallet") {
              const origin = DEFAULT_WEBWALLET_URL
              setPopupOptions({
                origin,
                location: "/interstitialLogin",
              })
              const webWallet = (await openWebwallet(origin)) ?? null
              wallet = webWallet as TBAStarknetWindowObject
            }

            // catridge controller
            else if (wallet_id === "controller") {
              let accountInterface: AccountInterface | null = null
              const shadowTarget = getTarget()
              new ControllerModal({
                target: shadowTarget,
                props: {
                  onConnect: (
                    accountInterface: AccountInterface,
                    controller: Controller,
                  ) => {
                    accountInterface = accountInterface
                    handleAccount(accountInterface, controller)
                  },
                  policies: policies,
                  hideModal: () => {
                    modal.$destroy()
                  },
                  rpc:
                    num.toHex(chainId) == SEPOLIA_CHAIN_ID
                      ? "https://api.cartridge.gg/x/starknet/sepolia"
                      : "https://api.cartridge.gg/x/starknet/mainnet",
                },
              })

              async function handleAccount(
                accountInterface: AccountInterface | null,
                controller: Controller,
              ) {
                if (accountInterface) {
                  const chainId = await accountInterface?.getChainId()

                  const provider = new RpcProvider({
                    nodeUrl: accountInterface?.channel.nodeUrl,
                  })
                  const account = new Account(
                    provider,
                    accountInterface?.address,
                    accountInterface?.signer,
                  )
                  if (account && chainId) {
                    const starknetWindowObject =
                      await getTokenboundAccountController({
                        address,
                        account,
                        provider,
                        chainId,
                      })
                    resolve({ starknetWindowObject, controller })
                    modal.$destroy()
                  }
                }
              }
              return
            }

            if (!wallet) {
              alert("Wallet not found!")
              return
            }

            const starknetWindowObject =
              await getTokenboundAccountStarknetObject({
                address,
                wallet,
                chainId,
              })
            resolve({ starknetWindowObject })
            modal.$destroy()
          } catch (error) {
            console.error("Error handling wallet connection:", error)
            resolve(undefined)
            modal.$destroy()
          }
        },
      },
    })
  })
}
