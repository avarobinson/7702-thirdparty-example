import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import Head from "next/head";
import { createWalletClient, custom, Hex } from "viem";
import { useSignAuthorization } from "@privy-io/react-auth";
// import { sepolia } from "viem/chains";
import { SmartAccountSigner, WalletClientSigner } from "@aa-sdk/core";
import {
  createModularAccountV2Client,
  ModularAccountV2Client,
} from "@account-kit/smart-contracts";
import { sepolia, alchemy } from "@account-kit/infra";
import { Authorization } from "viem/experimental";

export default function DashboardPage() {
  const router = useRouter();
  const { ready, authenticated, logout } = usePrivy();
  const { signer, client } = usePrivy7702();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  async function delegateandauth() {
    if (!client) {
      console.error("No client yet");
      return;
    }
    // Delegating (if not already) and sending a sponsored user operation
    const uoHash = await client.sendUserOperation({
      uo: {
        target: "0xc0ffee254729296a45a3885639AC7E10F9d54979",
        value: 0n,
        data: "0x0",
      },
    });
    const txnHash = await client.waitForUserOperationTransaction(uoHash);
    console.log("transaction hash", txnHash);
  }

  return (
    <div>
      <Head>
        <title>Privy Auth Demo</title>
      </Head>

      <main className="flex flex-col min-h-screen px-4 sm:px-20 py-6 sm:py-10 bg-privy-light-blue">
        {ready && authenticated ? (
          <>
            <div className="flex flex-row justify-between">
              <h1 className="text-2xl font-semibold">Privy Auth Demo</h1>
              <button
                onClick={logout}
                className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
              >
                Logout
              </button>
            </div>
            <div>
              <button onClick={delegateandauth}>delegate</button>
              <br />
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

const usePrivy7702 = () => {
  const { signAuthorization } = useSignAuthorization();
  const { wallets } = useWallets();
  const [signer, setSigner] = useState<SmartAccountSigner>();
  const [client, setClient] = useState<ModularAccountV2Client>();
  const embeddedWallet = wallets.find((x) => x.walletClientType === "privy");

  useEffect(() => {
    console.log("embeddedWallet", embeddedWallet, wallets);
    if (!embeddedWallet) {
      return;
    }

    (async () => {
      const baseSigner = new WalletClientSigner(
        createWalletClient({
          account: embeddedWallet!.address as Hex,
          chain: sepolia,
          transport: custom(await embeddedWallet!.getEthereumProvider()),
        }),
        "privy"
      );

      const signer: SmartAccountSigner = {
        getAddress: baseSigner.getAddress,
        signMessage: baseSigner.signMessage,
        signTypedData: baseSigner.signTypedData,
        signerType: baseSigner.signerType,
        inner: baseSigner.inner,
        signAuthorization: async (
          unsignedAuth: Authorization<number, false>
        ): Promise<Authorization<number, true>> => {
          const signature = await signAuthorization(unsignedAuth);

          return {
            ...unsignedAuth,
            ...{
              r: signature.r!,
              s: signature.s!,
              v: signature.v!,
            },
          };
        },
      };

      setSigner(signer);

      const client = await createModularAccountV2Client({
        chain: sepolia,
        transport: alchemy({ apiKey: process.env.ALCHEMY_API_KEY || "" }),
        signer,
        mode: "7702",
        policyId: process.env.ALCHEMY_POLICY_ID || "",
      });

      setClient(client);
    })();
  }, [embeddedWallet, signAuthorization, wallets]);

  return { signer, client };
};
