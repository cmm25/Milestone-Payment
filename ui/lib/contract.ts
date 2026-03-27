import { ethers } from "ethers";

export const CONTRACT_ADDRESS = "0x1be1c207d32723fa7d5685a021a5415fc83f1b35";

export const RSK_TESTNET = {
    chainId: "0x1f",
    chainName: "RSK Testnet",
    nativeCurrency: { name: "tRBTC", symbol: "tRBTC", decimals: 18 },
    rpcUrls: ["https://public-node.testnet.rsk.co"],
    blockExplorerUrls: ["https://explorer.testnet.rootstock.io"],
};

export const CONTRACT_ABI = [
    "constructor(address initialOwner)",
    "function createProject(address freelancer, string[] descriptions, uint256[] amounts, uint256[] deadlines) payable returns (uint256)",
    "function submitMilestone(uint256 projectId, uint256 milestoneId)",
    "function approveMilestone(uint256 projectId, uint256 milestoneId)",
    "function claimExpired(uint256 projectId, uint256 milestoneId)",
    "function getProject(uint256 projectId) view returns (address client, address freelancer, uint256 totalBudget, uint256 remainingBudget, uint256 milestoneCount, bool isActive)",
    "function getMilestone(uint256 projectId, uint256 milestoneId) view returns (string description, uint256 amount, uint256 deadline, uint8 status, bool isPaid)",
    "function owner() view returns (address)",
    "function paused() view returns (bool)",
    "event ProjectCreated(uint256 indexed projectId, address indexed client, address indexed freelancer, uint256 totalBudget, uint256 milestoneCount)",
    "event ProjectCompleted(uint256 indexed projectId)",
    "event MilestoneSubmitted(uint256 indexed projectId, uint256 indexed milestoneId)",
    "event MilestoneApproved(uint256 indexed projectId, uint256 indexed milestoneId, uint256 amount)",
    "event MilestoneExpired(uint256 indexed projectId, uint256 indexed milestoneId, uint256 refundAmount)",
];

export const MILESTONE_STATUS = ["Pending", "Submitted", "Approved", "Expired"] as const;

export function getReadContract() {
    const provider = new ethers.JsonRpcProvider(RSK_TESTNET.rpcUrls[0]);
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export function getWriteContract(signer: ethers.Signer) {
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

export interface ProjectData {
    client: string;
    freelancer: string;
    totalBudget: bigint;
    remainingBudget: bigint;
    milestoneCount: bigint;
    isActive: boolean;
}

export interface MilestoneData {
    description: string;
    amount: bigint;
    deadline: bigint;
    status: number;
    isPaid: boolean;
}

export async function fetchProject(projectId: number): Promise<ProjectData | null> {
    try {
        const contract = getReadContract();
        const [client, freelancer, totalBudget, remainingBudget, milestoneCount, isActive] =
            await contract.getProject(projectId);
        if (client === ethers.ZeroAddress) return null;
        return { client, freelancer, totalBudget, remainingBudget, milestoneCount, isActive };
    } catch {
        return null;
    }
}

export async function fetchMilestone(projectId: number, milestoneId: number): Promise<MilestoneData | null> {
    try {
        const contract = getReadContract();
        const [description, amount, deadline, status, isPaid] =
            await contract.getMilestone(projectId, milestoneId);
        return { description, amount, deadline, status: Number(status), isPaid };
    } catch {
        return null;
    }
}

export async function fetchAllMilestones(projectId: number, count: number): Promise<MilestoneData[]> {
    const milestones: MilestoneData[] = [];
    for (let i = 0; i < count; i++) {
        const m = await fetchMilestone(projectId, i);
        if (m) milestones.push(m);
    }
    return milestones;
}
