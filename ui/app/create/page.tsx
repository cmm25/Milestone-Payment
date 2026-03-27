"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { useWallet } from "@/lib/wallet";
import { useToast } from "@/lib/toast";
import { getWriteContract } from "@/lib/contract";

interface MilestoneInput {
  description: string;
  amount: string;
  deadline: string;
}

const emptyMilestone = (): MilestoneInput => ({
  description: "",
  amount: "",
  deadline: "",
});

export default function CreateProject() {
  const { signer, address, isCorrectChain } = useWallet();
  const { addToast } = useToast();
  const router = useRouter();

  const [freelancer, setFreelancer] = useState("");
  const [milestones, setMilestones] = useState<MilestoneInput[]>([emptyMilestone()]);
  const [loading, setLoading] = useState(false);

  function updateMilestone(index: number, field: keyof MilestoneInput, value: string) {
    setMilestones((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  function addMilestone() {
    setMilestones((prev) => [...prev, emptyMilestone()]);
  }

  function removeMilestone(index: number) {
    if (milestones.length <= 1) return;
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  }

  const totalBudget = milestones.reduce((sum, m) => {
    const val = parseFloat(m.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signer || !address || !isCorrectChain) {
      addToast("Connect your wallet to RSK Testnet first.", "error");
      return;
    }

    if (!ethers.isAddress(freelancer)) {
      addToast("Invalid freelancer address.", "error");
      return;
    }
    if (freelancer.toLowerCase() === address.toLowerCase()) {
      addToast("Client and freelancer cannot be the same address.", "error");
      return;
    }

    const descriptions: string[] = [];
    const amounts: bigint[] = [];
    const deadlines: bigint[] = [];

    for (const m of milestones) {
      if (!m.description.trim()) {
        addToast("All milestones need a description.", "error");
        return;
      }
      const amt = parseFloat(m.amount);
      if (isNaN(amt) || amt <= 0) {
        addToast("All milestone amounts must be greater than zero.", "error");
        return;
      }
      if (!m.deadline) {
        addToast("All milestones need a deadline.", "error");
        return;
      }
      const deadlineMs = new Date(m.deadline).getTime();
      if (isNaN(deadlineMs)) {
        addToast("Invalid deadline date.", "error");
        return;
      }
      if (deadlineMs <= Date.now()) {
        addToast("All deadlines must be in the future.", "error");
        return;
      }
      try {
        descriptions.push(m.description);
        amounts.push(ethers.parseEther(m.amount));
        deadlines.push(BigInt(Math.floor(deadlineMs / 1000)));
      } catch {
        addToast("Invalid amount format. Use a simple decimal number.", "error");
        return;
      }
    }

    const totalWei = amounts.reduce((a, b) => a + b, BigInt(0));

    setLoading(true);
    try {
      const contract = getWriteContract(signer);
      const tx = await contract.createProject(freelancer, descriptions, amounts, deadlines, {
        value: totalWei,
      });
      addToast("Transaction sent. Waiting for confirmation...", "info");
      await tx.wait();
      addToast("Project created successfully!", "success");
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { reason?: string; message?: string };
      addToast(error.reason || error.message || "Transaction failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)]">
      <div className="max-w-xl mx-auto px-6 py-12 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111] mb-2">
          Create Project
        </h1>
        <p className="text-sm text-[#999] mb-10">
          Lock the full budget in escrow. Funds release per milestone on your approval.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-[#333] mb-2">Freelancer Address</label>
            <input
              type="text"
              value={freelancer}
              onChange={(e) => setFreelancer(e.target.value)}
              placeholder="0x..."
              className="w-full h-12 px-4 text-sm border border-[#e5e5e5] rounded-xl bg-white text-[#111] placeholder:text-[#ccc] focus:outline-none focus:border-[#999] transition-colors font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-[#333]">Milestones</label>
              <button
                type="button"
                onClick={addMilestone}
                className="text-sm text-[#999] hover:text-[#111] transition-colors font-medium"
              >
                + Add
              </button>
            </div>

            <div className="space-y-4">
              {milestones.map((m, i) => (
                <div key={i} className="border border-[#e5e5e5] rounded-xl p-5 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#bbb]">#{i}</span>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(i)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={m.description}
                    onChange={(e) => updateMilestone(i, "description", e.target.value)}
                    placeholder="Milestone description"
                    className="w-full h-11 px-4 text-sm border border-[#e5e5e5] rounded-lg bg-[#fafafa] text-[#111] placeholder:text-[#ccc] focus:outline-none focus:border-[#999] transition-colors"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#999] mb-1.5">Amount (tRBTC)</label>
                      <input
                        type="number"
                        step="0.00001"
                        min="0"
                        value={m.amount}
                        onChange={(e) => updateMilestone(i, "amount", e.target.value)}
                        placeholder="0.00001"
                        className="w-full h-11 px-4 text-sm border border-[#e5e5e5] rounded-lg bg-[#fafafa] text-[#111] placeholder:text-[#ccc] focus:outline-none focus:border-[#999] transition-colors tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#999] mb-1.5">Deadline</label>
                      <input
                        type="date"
                        value={m.deadline}
                        onChange={(e) => updateMilestone(i, "deadline", e.target.value)}
                        className="w-full h-11 px-4 text-sm border border-[#e5e5e5] rounded-lg bg-[#fafafa] text-[#111] focus:outline-none focus:border-[#999] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#e5e5e5] pt-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-[#999]">Total Budget</span>
              <span className="text-lg font-semibold text-[#111] tabular-nums">{totalBudget.toFixed(4)} tRBTC</span>
            </div>

            <button
              type="submit"
              disabled={loading || !address || !isCorrectChain}
              className="w-full h-12 text-sm font-medium bg-[#111] text-white rounded-full hover:bg-[#333] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Project..." : !address ? "Connect Wallet First" : "Create Project & Lock Funds"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
