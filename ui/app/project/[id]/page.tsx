"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ethers } from "ethers";
import { useWallet } from "@/lib/wallet";
import { fetchProject, fetchAllMilestones, ProjectData, MilestoneData } from "@/lib/contract";
import MilestoneCard from "@/components/MilestoneCard";

export default function ProjectPage() {
    const params = useParams();
    const { address } = useWallet();

    const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
    const projectId = /^\d+$/.test(rawId ?? "") ? Number(rawId) : -1;
    const [project, setProject] = useState<ProjectData | null>(null);
    const [milestones, setMilestones] = useState<MilestoneData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (projectId < 0) {
            setError("Invalid project ID.");
            setProject(null);
            setMilestones([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const p = await fetchProject(projectId);
            if (!p) {
                setError("Project not found.");
                setProject(null);
                setMilestones([]);
            } else {
                setProject(p);
                const ms = await fetchAllMilestones(projectId, Number(p.milestoneCount));
                setMilestones(ms);
            }
        } catch {
            setError("Failed to load project data.");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        load();
    }, [load]);

    const role: "client" | "freelancer" | "viewer" =
        address && project
            ? address.toLowerCase() === project.client.toLowerCase()
                ? "client"
                : address.toLowerCase() === project.freelancer.toLowerCase()
                    ? "freelancer"
                    : "viewer"
            : "viewer";

    const roleBadge: Record<string, { label: string; className: string }> = {
        client: { label: "Client", className: "bg-blue-50 text-blue-600 border-blue-200" },
        freelancer: { label: "Freelancer", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
        viewer: { label: "Viewer", className: "bg-slate-50 text-slate-500 border-slate-200" },
    };

    return (
        <div className="min-h-[calc(100vh-64px)]">
            <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-[#111] transition-colors mb-8">
                    &larr; Back to Projects
                </Link>

                {loading && (
                    <div className="flex items-center justify-center py-32">
                        <div className="w-6 h-6 border-2 border-[#e5e5e5] border-t-[#111] rounded-full animate-spin" />
                    </div>
                )}

                {error && !loading && (
                    <div className="text-center py-32">
                        <p className="text-[#999] mb-2">{error}</p>
                        <p className="text-xs text-[#ccc]">Try a different project ID.</p>
                    </div>
                )}

                {project && !loading && (
                    <>
                        <div className="flex items-start justify-between gap-4 mb-8">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-2xl font-bold tracking-tight text-[#111]">Project #{projectId}</h1>
                                    <span
                                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${project.isActive
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                : "bg-slate-50 text-slate-500 border-slate-200"
                                            }`}
                                    >
                                        {project.isActive ? "Active" : "Completed"}
                                    </span>
                                </div>
                                <p className="text-sm text-[#999]">
                                    {Number(project.milestoneCount)} milestone{Number(project.milestoneCount) !== 1 ? "s" : ""} &middot;{" "}
                                    {ethers.formatEther(project.totalBudget)} tRBTC total budget
                                </p>
                            </div>

                            {address && (
                                <span
                                    className={`text-xs font-medium px-3 py-1 rounded-full border ${roleBadge[role].className}`}
                                >
                                    {roleBadge[role].label}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="border border-[#e5e5e5] rounded-xl p-5 bg-white">
                                <p className="text-xs text-[#999] mb-1">Client</p>
                                <p className="text-sm font-mono text-[#333] truncate">{project.client}</p>
                            </div>
                            <div className="border border-[#e5e5e5] rounded-xl p-5 bg-white">
                                <p className="text-xs text-[#999] mb-1">Freelancer</p>
                                <p className="text-sm font-mono text-[#333] truncate">{project.freelancer}</p>
                            </div>
                            <div className="border border-[#e5e5e5] rounded-xl p-5 bg-white">
                                <p className="text-xs text-[#999] mb-1">Total Budget</p>
                                <p className="text-sm font-semibold text-[#111] tabular-nums">{ethers.formatEther(project.totalBudget)} tRBTC</p>
                            </div>
                            <div className="border border-[#e5e5e5] rounded-xl p-5 bg-white">
                                <p className="text-xs text-[#999] mb-1">Remaining in Escrow</p>
                                <p className="text-sm font-semibold text-[#111] tabular-nums">{ethers.formatEther(project.remainingBudget)} tRBTC</p>
                            </div>
                        </div>

                        {role === "client" && (
                            <div className="border border-blue-200 bg-blue-50 rounded-xl p-5 mb-10">
                                <p className="text-xs text-blue-500 mb-1">Released to Freelancer</p>
                                <p className="text-sm font-semibold text-blue-700 tabular-nums">
                                    {ethers.formatEther(project.totalBudget - project.remainingBudget)} tRBTC
                                </p>
                            </div>
                        )}

                        {role === "freelancer" && (
                            <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-5 mb-10">
                                <p className="text-xs text-emerald-500 mb-1">Earnings Received</p>
                                <p className="text-sm font-semibold text-emerald-700 tabular-nums">
                                    {ethers.formatEther(project.totalBudget - project.remainingBudget)} tRBTC
                                </p>
                            </div>
                        )}

                        {role === "viewer" && <div className="mb-10" />}

                        <div>
                            <h2 className="text-lg font-semibold text-[#111] mb-4">Milestones</h2>
                            <div className="space-y-4">
                                {milestones.map((m, i) => (
                                    <MilestoneCard
                                        key={i}
                                        milestone={m}
                                        index={i}
                                        projectId={projectId}
                                        role={role}
                                        onUpdate={load}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
