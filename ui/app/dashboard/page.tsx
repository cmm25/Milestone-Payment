"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ethers } from "ethers";
import { useWallet } from "@/lib/wallet";
import { fetchProject, ProjectData } from "@/lib/contract";

interface ProjectCard {
    id: number;
    data: ProjectData;
}

export default function Dashboard() {
    const { address } = useWallet();
    const router = useRouter();
    const [projects, setProjects] = useState<ProjectCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    useEffect(() => {
        if (!address) {
            router.push("/");
            return;
        }

        async function loadProjects() {
            setLoading(true);
            setFetchError(false);
            try {
                const cards: ProjectCard[] = [];
                const batchSize = 5;
                let id = 1;
                let done = false;

                while (!done) {
                    const batch = Array.from({ length: batchSize }, (_, i) => id + i);
                    const results = await Promise.all(
                        batch.map(async (pid) => {
                            const data = await fetchProject(pid);
                            return data ? { id: pid, data } : null;
                        })
                    );

                    let allNull = true;
                    for (const r of results) {
                        if (r) {
                            cards.push(r);
                            allNull = false;
                        }
                    }

                    if (allNull) {
                        done = true;
                    } else {
                        id += batchSize;
                    }
                }

                cards.sort((a, b) => b.id - a.id);
                setProjects(cards);
            } catch (err) {
                console.error("Failed to load projects:", err);
                setFetchError(true);
            } finally {
                setLoading(false);
            }
        }

        loadProjects();
    }, [address, router]);

    function truncateAddr(addr: string) {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }

    function getRole(p: ProjectData): string {
        if (!address) return "Viewer";
        if (address.toLowerCase() === p.client.toLowerCase()) return "Client";
        if (address.toLowerCase() === p.freelancer.toLowerCase()) return "Freelancer";
        return "Viewer";
    }

    return (
        <div className="min-h-[calc(100vh-64px)]">
            <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111]">Projects</h1>
                        <p className="text-sm text-[#999] mt-1">On-chain escrow projects on Rootstock Testnet</p>
                    </div>
                    <Link
                        href="/create"
                        className="h-10 px-5 text-sm font-medium bg-[#111] text-white rounded-full hover:bg-[#333] transition-colors inline-flex items-center gap-1.5"
                    >
                        Create Project <span className="text-base">+</span>
                    </Link>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-32">
                        <div className="w-6 h-6 border-2 border-[#e5e5e5] border-t-[#111] rounded-full animate-spin" />
                    </div>
                )}

                {!loading && fetchError && (
                    <div className="text-center py-32">
                        <p className="text-red-500 mb-2">Failed to load projects from the network.</p>
                        <p className="text-sm text-[#999]">Check your connection and try refreshing the page.</p>
                    </div>
                )}

                {!loading && !fetchError && projects.length === 0 && (
                    <div className="text-center py-32">
                        <p className="text-[#999] mb-2">No projects found on-chain yet.</p>
                        <p className="text-sm text-[#ccc]">Create your first escrow project to get started.</p>
                    </div>
                )}

                {!loading && projects.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.map((p) => {
                            const roleLabel = getRole(p.data);
                            return (
                                <Link
                                    key={p.id}
                                    href={`/project/${p.id}`}
                                    className="block border border-[#e5e5e5] rounded-xl p-5 bg-white hover:border-[#ccc] hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-semibold text-[#111]">Project #{p.id}</span>
                                        <span
                                            className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${p.data.isActive
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                    : "bg-slate-50 text-slate-500 border-slate-200"
                                                }`}
                                        >
                                            {p.data.isActive ? "Active" : "Completed"}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[#999]">Client</span>
                                            <span className="font-mono text-[#666]">{truncateAddr(p.data.client)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[#999]">Freelancer</span>
                                            <span className="font-mono text-[#666]">{truncateAddr(p.data.freelancer)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-[#f0f0f0]">
                                        <span className="text-xs text-[#999]">
                                            {Number(p.data.milestoneCount)} milestone{Number(p.data.milestoneCount) !== 1 ? "s" : ""}
                                        </span>
                                        <span className="text-sm font-semibold text-[#111] tabular-nums">
                                            {ethers.formatEther(p.data.totalBudget)} tRBTC
                                        </span>
                                    </div>

                                    {roleLabel !== "Viewer" && (
                                        <div className="mt-3">
                                            <span
                                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${roleLabel === "Client"
                                                        ? "bg-blue-50 text-blue-600 border-blue-200"
                                                        : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                    }`}
                                            >
                                                Your role: {roleLabel}
                                            </span>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
