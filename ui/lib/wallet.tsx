"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import { RSK_TESTNET } from "./contract";

interface WalletState {
    address: string | null;
    signer: ethers.Signer | null;
    chainId: number | null;
    isConnecting: boolean;
    isCorrectChain: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    switchChain: () => Promise<void>;
}

const WalletContext = createContext<WalletState>({
    address: null,
    signer: null,
    chainId: null,
    isConnecting: false,
    isCorrectChain: false,
    connect: async () => { },
    disconnect: () => { },
    switchChain: async () => { },
});

export function useWallet() {
    return useContext(WalletContext);
}

export function WalletProvider({ children }: { children: ReactNode }) {
    const [address, setAddress] = useState<string | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const isCorrectChain = chainId === 31;

    const connect = useCallback(async () => {
        if (typeof window === "undefined" || !window.ethereum) {
            alert("Please install MetaMask to use this app.");
            return;
        }
        setIsConnecting(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const s = await provider.getSigner();
            const addr = await s.getAddress();
            const network = await provider.getNetwork();
            setSigner(s);
            setAddress(addr);
            setChainId(Number(network.chainId));
        } catch (err) {
            console.error("Failed to connect:", err);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        setAddress(null);
        setSigner(null);
        setChainId(null);
    }, []);

    const switchChain = useCallback(async () => {
        if (!window.ethereum) return;
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: RSK_TESTNET.chainId }],
            });
        } catch (switchError: unknown) {
            const err = switchError as { code?: number };
            if (err.code === 4902) {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [RSK_TESTNET],
                });
            }
        }
        await connect();
    }, [connect]);

    useEffect(() => {
        if (typeof window === "undefined" || !window.ethereum) return;

        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0) disconnect();
            else {
                const provider = new ethers.BrowserProvider(window.ethereum!);
                provider.getSigner().then(async (s) => {
                    const addr = await s.getAddress();
                    const network = await provider.getNetwork();
                    setSigner(s);
                    setAddress(addr);
                    setChainId(Number(network.chainId));
                }).catch(() => disconnect());
            }
        };
        const handleChainChanged = () => {
            const provider = new ethers.BrowserProvider(window.ethereum!);
            provider.getSigner().then(async (s) => {
                const addr = await s.getAddress();
                const network = await provider.getNetwork();
                setSigner(s);
                setAddress(addr);
                setChainId(Number(network.chainId));
            }).catch(() => disconnect());
        };

        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);
        return () => {
            window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
            window.ethereum?.removeListener("chainChanged", handleChainChanged);
        };
    }, [connect, disconnect]);

    return (
        <WalletContext.Provider
            value={{ address, signer, chainId, isConnecting, isCorrectChain, connect, disconnect, switchChain }}
        >
            {children}
        </WalletContext.Provider>
    );
}
