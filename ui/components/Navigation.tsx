"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet";

export default function Navigation() {
    const { address, isCorrectChain, switchChain, disconnect } = useWallet();
    const pathname = usePathname();
    const router = useRouter();
    const isLanding = pathname === "/";

    if (isLanding) return null;

    const truncated = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

    function handleDisconnect() {
        disconnect();
        router.push("/");
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-[#fafafa]/80 backdrop-blur-md border-b border-[#e5e5e5]">
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/dashboard" className="text-base font-semibold tracking-tight text-[#111]">
                    FreelanceEscrow
                </Link>

                {address && !isCorrectChain && (
                    <button
                        onClick={switchChain}
                        className="h-9 px-5 text-sm font-medium bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors"
                    >
                        Switch to RSK
                    </button>
                )}

                {address && isCorrectChain && (
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-[#666] bg-[#f0f0f0] px-3 py-1.5 rounded-full border border-[#e5e5e5]">
                            {truncated}
                        </span>
                        <button
                            onClick={handleDisconnect}
                            className="h-9 px-4 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full hover:bg-amber-100 transition-colors"
                        >
                            Disconnect
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
