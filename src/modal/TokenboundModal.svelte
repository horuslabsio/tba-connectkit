<script lang="ts">
  import { onMount } from "svelte"
   import TBALOGO from '../assets/tbaLogo.svelte'

  export let callback: (options: Options) => Promise<void> = async () => {}
    
  export let closeModal: () => void
  export let theme: "light" | "dark" | null = null

  let loading: boolean = false

  type Options = {
    address: string
    parentWallet: string
  }

  let options: Options = {
    address: "",
    parentWallet: "",
  }

  let errors = {
    address: "",
    parentWallet: "",
  }

  let wallets = [
    { id: "braavos", label: "Braavos" },
    { id: "argentx", label: "ArgentX" },
    { id: "ArgentWebWallet", label: "Argent Web Wallet" },
    { id: "controller", label: "Controller" },
  ]

  const setLoading = (state: boolean) => {
    loading = state
  }

  const handleSubmit = async () => {
    setLoading(true)

    const newErrors = {
      address: !options.address
        ? "Please enter a valid tokenbound account address"
        : "",
      parentWallet: !options.parentWallet ? "Please select parent wallet" : "",
    }
    errors = newErrors
    if (Object.values(newErrors).some((error) => error)) return
    try {
      await callback(options)
      setLoading(false)
    } catch (error) {
      console.error("Error in callback", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (event: Event) => {
    const input = event.target as HTMLInputElement
    let name = input.name
    options[name as keyof Options] = input.value
  }

  const handleSelectChange = (event: Event) => {
    const select = event.target as HTMLSelectElement
    options.parentWallet = select.value
  }

  let darkModeControlClass = theme === "dark" ? "dark" : ""
  onMount(() => {
    if (
      theme === "dark" ||
      (theme === null &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      darkModeControlClass = "dark"
    } else {
      darkModeControlClass = ""
    }
  })
</script>

<div
  part="tokenbound-modal"
  class={`modal-font backdrop-blur-sm fixed inset-0 flex items-center 
    justify-center bg-black/25 z-[9999] ${darkModeControlClass}`}
  role="dialog"
  aria-labelledby="modalTitle"
  aria-describedby="modalDescription"
  aria-hidden={true ? "false" : "true"}
>
  <main
    class="h-screen w-screen flex items-center justify-center overflow-y-hidden"
  >
    <div
      class="bg-overlay bg-left w-full max-w-[400px] md:max-w-[650px] font-poppins border border-gray-500 h-[65%] max-h-[450px] md:max-h-[420px] overflow-clip rounded-[14px] md:rounded-[24px] flex flex-col justify-between md:flex-row"
    >
      <div
        class="md:basis-[40%] basis-[20%] p-4 w-full relative rounded-[14px] flex flex-col gap-4 justify-center items-center"
      >
        <button
          id="close-button"
          on:click={closeModal}
          class="absolute left-4 top-4 text-white text-xl"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            fill="none"
            viewBox="0 0 12 12"
          >
            <path
              d="M9.77275 3.02275C9.99242 2.80308 9.99242 2.44692 9.77275 2.22725C9.55308 2.00758 9.19692 2.00758 8.97725 2.22725L6 5.20451L3.02275 2.22725C2.80308 2.00758 2.44692 2.00758 2.22725 2.22725C2.00758 2.44692 2.00758 2.80308 2.22725 3.02275L5.20451 6L2.22725 8.97725C2.00758 9.19692 2.00758 9.55308 2.22725 9.77275C2.44692 9.99242 2.80308 9.99242 3.02275 9.77275L6 6.79549L8.97725 9.77275C9.19692 9.99242 9.55308 9.99242 9.77275 9.77275C9.99242 9.55308 9.99242 9.19692 9.77275 8.97725L6.79549 6L9.77275 3.02275Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <div class="md:w-[70px] w-[50px] relative before:content-[''] before:w-[60%] before:absolute before:left-1/2 before:-translate-x-1/2 before:h-[65%] before:top-1/2 before:rounded-full before:-translate-y-1/2  before:bg-white">
          <TBALOGO />
        </div>

        <div>
          <p class="text-base md:text-lg font-medium text-[#F0F0F0]">
            Connect Account
          </p>
        </div>
      </div>

      <div
        class="bg-white flex-1 md:basis-[60%] flex h-full items-center justify-center rounded-[14px] md:rounded-[24px]"
      >
        <div class="p-4">
          <div>
            <h1 class="text-[#1E1E1E] text-lg md:text-xl font-semibold mb-2">
              Connect Tokenbound Account
            </h1>
            <p class="text-[#7E7E7E] text-xs md:text-sm">
              Provide your Tokenbound account address and select its parent
              wallet.
            </p>
          </div>
          <div class="md:mt-8 mt-4 flex flex-col gap-4 md:gap-6">
            <label for="tba-address" class="relative block">
              <span class="sr-only">Tokenbound Account address</span>
              <input
                type="text"
                placeholder="Account address"
                id="tba-address"
                name="address"
                value={options.address}
                on:input={handleChange}
                aria-invalid={!!errors.address}
                aria-describedby="address-error"
                class={`w-full border text-sm bg-white text-black font-normal rounded-[4px] px-3 py-2 mb-1 placeholder:text-gray-500 focus:outline-none focus:border-gray-500 ${errors.address ? "border-red-500" : "border-[#C7C7C7]"}`}
              />
              {#if errors.address}
                <p
                  id="address-error"
                  role="alert"
                  class="text-red-500 absolute -top-4 right-2 text-xs"
                  aria-live="assertive"
                >
                  {errors.address} *
                </p>
              {/if}
            </label>

            <div class="relative">
              <label for="parentWallet" class="sr-only">Parent Wallet</label>
              <div
                class={`w-full border text-sm bg-white text-black font-normal rounded-[4px] px-3 py-2 mb-1 placeholder:text-gray-500 focus-within:outline-none focus-within:border-gray-500 ${errors.parentWallet ? "border-red-500" : "border-[#C7C7C7]"}`}
              >
                <select
                  id="parentWallet"
                  name="parentWallet"
                  value={options.parentWallet}
                  on:change={handleSelectChange}
                  aria-invalid={!!errors.parentWallet}
                  aria-describedby="wallet-error"
                  class="w-full h-full focus:outline-none"
                >
                  <option value="" disabled>Select parent wallet</option>
                  {#each wallets as { id, label }}
                    <option value={id} class="capitalize">{label}</option>
                  {/each}
                </select>
              </div>
              {#if errors.parentWallet}
                <p
                  id="wallet-error"
                  role="alert"
                  class="text-red-500 absolute -top-4 right-2 text-xs"
                  aria-live="assertive"
                >
                  {errors.parentWallet} *
                </p>
              {/if}
            </div>
          </div>

          <div class="w-full mt-4 md:mt-8">
            <button
              on:click={handleSubmit}
              class="w-full text-[#F9F9F9] bg-[#272727] rounded-lg text-sm md:text-base border-[#272727] outline-none p-2"
            >
              Connect account
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>
