import {
  HANDLE_REGISTRY_CONTRACT_ADDRESS,
  HANDLES_CONTRACT_ADDRESS,
  HUB_CONTRACT_ADDRESS,
  NETWORK,
  TOKENBOUND_PROXY_ADDRESS,
} from "../constants/coloniz"
import { ColonizProfile } from "src/types/modal"
import Controller from "@cartridge/controller"
import { AccountInterface, Signature, typedData, TypedData } from "starknet"

const COLONIZ_ENDPOINT = "https://dev.coloniz.xyz/graphql"

export const prepareSignedAuthMessage = async (
  account: AccountInterface,
  address: string,
): Promise<{
  signature: Signature
  messageHash: string
  typedMessage: TypedData
} | null> => {
  try {
    const response = await fetch(COLONIZ_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation GenerateNonce($address: String!) {
            generateNonce(address: $address) {
              profileAddress
              nonce
              timestamp
            }
          }
        `,
        variables: { address },
      }),
    })

    const result = await response.json()
    const nonce = result?.data?.generateNonce?.nonce

    if (!nonce) throw new Error("Nonce not received")

    const typedMessage: TypedData = {
      types: {
        StarknetDomain: [
          { name: "name", type: "shortstring" },
          { name: "version", type: "shortstring" },
          { name: "chainId", type: "shortstring" },
          { name: "revision", type: "shortstring" },
        ],
        Signin: [
          { name: "content", type: "string" },
          { name: "nonce", type: "string" },
          { name: "timestamp", type: "string" },
        ],
      },
      primaryType: "Signin",
      domain: {
        name: "Coloniz",
        version: "1",
        revision: "1",
        chainId: NETWORK,
      },
      message: {
        content: `Sign in to Coloniz ${window.location.href}`,
        nonce,
        timestamp: new Date().toISOString(),
      },
    }

    const signature = await account.signMessage(typedMessage)
    const messageHash = typedData.getMessageHash(typedMessage, address)

    return { signature, messageHash, typedMessage }
  } catch (err) {
    console.error("prepareSignedAuthMessage error:", err)
    return null
  }
}

export const authenticateUser = async (
  signature: Signature,
  messageHash: string,
  address: string,
): Promise<{
  access_token: string
  profile: any
} | null> => {
  try {
    const response = await fetch(COLONIZ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          mutation Login($auth: AuthInput!) {
            login(auth: $auth) {
              access_token
              profile {
                id,
                profileAddress
                displayName
                email
                bio
                handle {
                handle
                }
              }
            }
          }
        `,
        variables: {
          auth: {
            address,
            signature: null,
            signatureArray: signature,
            message: messageHash,
            isCartridge: true,
          },
        },
      }),
    })

    const { data, errors } = await response.json()

    if (errors) {
      throw errors
    }

    return data?.login ?? null
  } catch (err) {
    throw err
  }
}

export const handleAuth = async (
  account: AccountInterface,
  address: string,
): Promise<{
  access_token: string
  profile: ColonizProfile
} | null> => {
  if (!account || !address) return null
  try {
    const data = await prepareSignedAuthMessage(account, address)
    if (data) {
      const { messageHash, signature } = data
      const { access_token, profile } =
        (await authenticateUser(signature, messageHash, address)) || {}
      if (access_token) {
        return {
          access_token,
          profile: {
            id: profile?.id,
            displayName: profile?.displayName,
            handle: profile?.handle?.handle,
            profileAddress: profile?.profileAddress,
            bio: profile?.bio,
            email: profile?.email
          },
        }
      }
    }
    return null
  } catch (err) {
    throw err
  }
}

export const policies = {
  contracts: {
    [TOKENBOUND_PROXY_ADDRESS]: {
      name: "Tokenbound Sessions",
      description: "Enables session keys with tokenbound accounts",
      methods: [
        {
          name: "execute",
          description: "execute proxy",
          entrypoint: "execute",
        },
      ],
    },
    // hub contract
    [HUB_CONTRACT_ADDRESS]: {
      name: "Create Profile",
      description: "Create your Coloniz user Profile",
      methods: [
        {
          name: "create profile",
          description: "Create Coloniz Profile",
          entrypoint: "create_profile",
        },
      ],
    },
    // handles contract address
    [HANDLES_CONTRACT_ADDRESS]: {
      name: "Mint handle",
      description: "Mint Profile handle",
      methods: [
        {
          name: "mint handle",
          description: "Mint Coloniz Profile handle",
          entrypoint: "mint_handle",
        },
      ],
    },
    // handle registry
    [HANDLE_REGISTRY_CONTRACT_ADDRESS]: {
      name: "Link handle",
      description: "Link handle to Profile",
      methods: [
        {
          name: "Link Handle",
          description: "Link handle to Coloniz Profile",
          entrypoint: "link",
        },
      ],
    },
  },
  messages: [
    {
      name: "Sign in to Coloniz",
      description: "Sign the message to login to Coloniz",
      types: {
        StarknetDomain: [
          { name: "name", type: "shortstring" },
          { name: "version", type: "shortstring" },
          { name: "chainId", type: "shortstring" },
          { name: "revision", type: "shortstring" },
        ],
        Signin: [
          { name: "content", type: "string" },
          { name: "nonce", type: "string" },
          { name: "timestamp", type: "string" },
        ],
      },
      primaryType: "Signin",
      domain: {
        name: "Coloniz",
        version: "1",
        revision: "1",
        chainId: NETWORK,
      },
    },
  ],
}

let _controller: Controller | null = null

export const setController = (controller: Controller) => {
  _controller = controller
}

export const getController = (): Controller | null => _controller

export const clearController = () => {
  _controller = null
}
