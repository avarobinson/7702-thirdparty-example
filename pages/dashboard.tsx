import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import Head from "next/head";
import { createWalletClient, custom, Hex } from "viem";
import { useSignAuthorization } from "@privy-io/react-auth";
import {
  AuthorizationRequest,
  SmartAccountSigner,
  WalletClientSigner,
} from "@aa-sdk/core";
import {
  createModularAccountV2Client,
  ModularAccountV2Client,
} from "@account-kit/smart-contracts";
import { sepolia, alchemy } from "@account-kit/infra";
import { SignedAuthorization } from "viem/experimental";

export default function DashboardPage() {
  const router = useRouter();
  const { ready, authenticated, logout } = usePrivy();
  const { client } = usePrivy7702();
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find((x) => x.walletClientType === "privy");
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

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
    setIsLoading(true);
    try {
      const uoHash = await client.sendUserOperation({
        uo: {
          target: "0xc0ffee254729296a45a3885639AC7E10F9d54979",
          value: 0n,
          data: "0x0",
        },
      });
      const txnHash = await client.waitForUserOperationTransaction(uoHash);
      setTransactionHash(txnHash);
      console.log("transaction hash", txnHash);
    } catch (error) {
      console.error("Transaction failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Head>
        <title>Alchemy Smart Wallets + EIP-7702</title>
      </Head>

      <main className="min-h-screen px-4 sm:px-20 py-6 sm:py-10 bg-gradient-to-br from-blue-50 to-indigo-100">
        {ready && authenticated ? (
          <div className="max-w-3xl mx-auto">
            <header className="flex flex-row justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-indigo-900">
                Alchemy Smart Wallets + EIP-7702
              </h1>
              <button
                onClick={logout}
                className="text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Logout
              </button>
            </header>

            <section className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <p className="text-gray-700 mb-4">
                This demo showcases how to upgrade an existing embedded Privy
                EOA to a smart wallet using Alchemy's EIP-7702 support to send
                sponsored transactions from an EOA. Learn more about EIP-7702{" "}
                <a
                  href="https://www.alchemy.com/docs/wallets/react/using-7702"
                  className="text-indigo-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  here
                </a>
                .
              </p>
              {embeddedWallet && (
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Embedded EOA Address
                  </h2>
                  <p className="text-gray-600 font-mono break-all">
                    {embeddedWallet.address}
                  </p>
                </div>
              )}
              <button
                onClick={delegateandauth}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                  isLoading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isLoading
                  ? "Processing..."
                  : "Upgrade & Send Sponsored Transaction"}
              </button>
            </section>

            {transactionHash && (
              <section className="bg-green-50 rounded-xl shadow-lg p-6 border border-green-200">
                <h2 className="text-lg font-semibold text-green-900 mb-4">
                  Congrats! Sponsored transaction successful!
                </h2>
                <p className="text-green-700 mb-4">
                  You've successfully upgraded your EOA to a smart account and
                  sent your first sponsored transaction.{" "}
                  <a
                    href="https://www.alchemy.com/docs/wallets/react/using-7702"
                    className="text-indigo-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Keep building
                  </a>
                  .
                </p>
                <p className="text-green-700">
                  <strong>Transaction Hash:</strong>{" "}
                  <span className="font-mono break-all">{transactionHash}</span>
                </p>
              </section>
            )}
          </div>
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
        ...baseSigner,
        signAuthorization: async (
          unsignedAuth: AuthorizationRequest<number>
        ): Promise<SignedAuthorization<number>> => {
          const contractAddress =
            unsignedAuth.contractAddress ?? unsignedAuth.address;

          const signature = await signAuthorization({
            ...unsignedAuth,
            contractAddress,
          });

          return {
            ...unsignedAuth,
            ...{
              r: signature.r!,
              s: signature.s!,
              v: signature.v!,
            },
            address: contractAddress,
          };
        },
      };

      setSigner(signer);

      const client = await createModularAccountV2Client({
        chain: sepolia,
        transport: alchemy({
          apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "",
        }),
        signer,
        mode: "7702",
        policyId: process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID || "",
      });

      setClient(client);
    })();
  }, [embeddedWallet, signAuthorization, wallets]);

  return { signer, client };
};
