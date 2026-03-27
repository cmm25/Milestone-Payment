"use client";

import { ethers } from "ethers";
import { MilestoneData, MILESTONE_STATUS, getWriteContract } from "@/lib/contract";
import { useWallet } from "@/lib/wallet";
import { useToast } from "@/lib/toast";
import { useState } from "react";

interface Props {
    milestone: MilestoneData;
    index: number;
    projectId: number;
    role: "client" | "freelancer" | "viewer";
    onUpdate: () => void;
}

export default function MilestoneCard({ milestone, index, projectId, role, onUpdate }: Props) {
    const { signer, isCorrectChain, switchChain } = useWallet();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);

    const statusLabel = MILESTONE_STATUS[milestone.status];
    const deadlineDate = new Date(Number(milestone.deadline) * 1000);
    const isExpired = Date.now() > deadlineDate.getTime();
    const amountEth = ethers.formatEther(milestone.amount);

    const statusColor: Record<string, string> = {
        Pending: "bg-slate-100 text-slate-600 border-slate-200",
        Submitted: "bg-blue-50 text-blue-600 border-blue-200",
        Approved: "bg-emerald-50 text-emerald-600 border-emerald-200",
        Expired: "bg-red-50 text-red-600 border-red-200",
    };

    async function handleAction(action: "submit" | "approve" | "claimExpired") {
        if (!signer) return;
        setLoading(true);
        try {
            const contract = getWriteContract(signer);
            let tx;
            if (action === "submit") tx = await contract.submitMilestone(projectId, index);
            else if (action === "approve") tx = await contract.approveMilestone(projectId, index);
            else tx = await contract.claimExpired(projectId, index);
            addToast("Transaction sent. Waiting for confirmation...", "info");
            await tx.wait();
            addToast(
                action === "submit"
                    ? "Milestone submitted"
                    : action === "approve"
                        ? "Milestone approved & payment released"
                        : "Expired milestone refund claimed",
                "success"
            );
            onUpdate();
        } catch (err: unknown) {
            const error = err as { reason?: string; message?: string };
            addToast(error.reason || error.message || "Transaction failed", "error");
        } finally {
            setLoading(false);
        }
    }

    const showSubmit = role === "freelancer" && milestone.status === 0;
    const showApprove = role === "client" && milestone.status === 1;
    const showClaim = role === "client" && (milestone.status === 0 || milestone.status === 1) && isExpired;
    const needsChainSwitch = !isCorrectChain && (showSubmit || showApprove || showClaim);

    return (
        <div className="border border-[#e5e5e5] rounded-xl p-5 bg-white hover:border-[#ccc] transition-colors">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-xs font-mono text-[#bbb]">#{index}</span>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusColor[statusLabel]}`}>
                            {statusLabel}
                        </span>
                        {milestone.isPaid && (
                            <span className="text-xs text-emerald-600 font-medium">Paid</span>
                        )}
                    </div>
                    <p className="text-sm font-medium text-[#333] truncate">{milestone.description}</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#111] tabular-nums">{amountEth} tRBTC</p>
                    <p className={`text-xs mt-0.5 ${isExpired && milestone.status < 2 ? "text-red-500" : "text-[#bbb]"}`}>
                        {deadlineDate.toLocaleDateString()}
                    </p>
                </div>
            </div>

            {needsChainSwitch && (
                <div className="flex items-center gap-2 pt-3 border-t border-[#f0f0f0]">
                    <button
                        onClick={switchChain}
                        className="flex-1 h-9 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                        Switch to RSK Testnet to continue
                    </button>
                </div>
            )}

            {!needsChainSwitch && (showSubmit || showApprove || showClaim) && (
                <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
                    {showSubmit && (
                        <button
                            onClick={() => handleAction("submit")}
                            disabled={loading}
                            className="flex-1 h-9 text-sm font-medium bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50"
                        >
                            {loading ? "Submitting..." : "Submit Work"}
                        </button>
                    )}
                    {showApprove && (
                        <button
                            onClick={() => handleAction("approve")}
                            disabled={loading}
                            className="flex-1 h-9 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? "Approving..." : "Approve & Pay"}
                        </button>
                    )}
                    {showClaim && (
                        <button
                            onClick={() => handleAction("claimExpired")}
                            disabled={loading}
                            className="flex-1 h-9 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                            {loading ? "Claiming..." : "Claim Refund"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
