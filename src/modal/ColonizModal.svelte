<script lang="ts">
  import { onMount } from "svelte"
  import Controller from "@cartridge/controller"
  import { AccountInterface, constants } from "starknet"
  import { policies } from "../helpers/Coloniz"

  export let onConnect: (
    account: AccountInterface,
    controller: Controller,
  ) => void

  export let chainId: constants.StarknetChainId

  let controller = new Controller({
    policies,
    defaultChainId: chainId as constants.StarknetChainId,
    chains: [
      { rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia" },
      { rpcUrl: "https://api.cartridge.gg/x/starknet/mainnet" },
    ],
  })

  async function connect() {
    try {
      const res = await controller.connect()
      if (res) {
        onConnect(res, controller)
      }
    } catch (e) {
      throw e
    }
  }

  onMount(async () => {
    console.log("hello world")
    await controller.probe()
    await connect()
  })
</script>
