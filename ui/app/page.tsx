"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet";

export default function Home() {
    const { address, connect, isConnecting, connectError } = useWallet();
    const router = useRouter();

    useEffect(() => {
        if (address) router.push("/dashboard");
    }, [address, router]);

    return (
        <section className="relative h-screen -mt-16 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col justify-center w-full px-8 sm:px-16 md:px-24 lg:px-32">
                <div className="max-w-xl">
                    <span className="inline-block text-[11px] font-medium tracking-[0.2em] uppercase text-[#999] border border-[#e0e0e0] rounded-full px-4 py-1.5 mb-10">
                        Milestone-Based Escrow
                    </span>

                    <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-bold tracking-tight leading-[1.1] text-[#111] mb-6">
                        Trustless payments for freelancers.
                    </h1>

                    <p className="text-[15px] text-[#777] leading-relaxed mb-12 max-w-sm">
                        Lock budgets on-chain. Release per milestone. Missed deadlines auto-refund.
                    </p>

                    <button
                        onClick={connect}
                        disabled={isConnecting}
                        className="h-12 px-7 text-sm font-medium bg-[#111] text-white rounded-full hover:bg-[#333] transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                    >
                        {isConnecting ? "Connecting..." : "Connect Wallet"} <span>&rarr;</span>
                    </button>

                    {connectError && (
                        <p className="mt-4 text-sm text-red-500">{connectError}</p>
                    )}
                </div>
            </div>

            <div className="pb-8 flex justify-center">
                <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#ccc]">
                    FreelanceEscrow v1.0 &middot; Rootstock Testnet
                </span>
            </div>
        </section>
    );
}
