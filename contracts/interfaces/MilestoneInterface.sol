// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IMilestoneEscrow {

    enum MilestoneStatus {
        PENDING,
        SUBMITTED,
        APPROVED,
        EXPIRED
    }

    event ProjectCreated(
        uint256 indexed projectId,
        address indexed client,
        address indexed freelancer,
        uint256 totalBudget,
        uint256 milestoneCount
    );

    event MilestoneSubmitted(
        uint256 indexed projectId,
        uint256 indexed milestoneId
    );

    event MilestoneApproved(
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        uint256 amount
    );

    event MilestoneExpired(
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        uint256 refundAmount
    );

    event ProjectCompleted(uint256 indexed projectId);

    function createProject(
        address freelancer,
        string[] calldata descriptions,
        uint256[] calldata amounts,
        uint256[] calldata deadlines
    ) external payable returns (uint256 projectId);

    function submitMilestone(
        uint256 projectId,
        uint256 milestoneId
    ) external;

    function approveMilestone(
        uint256 projectId,
        uint256 milestoneId
    ) external;

    function claimExpired(
        uint256 projectId,
        uint256 milestoneId
    ) external;

    function getProject(uint256 projectId) external view returns (
        address client,
        address freelancer,
        uint256 totalBudget,
        uint256 remainingBudget,
        uint256 milestoneCount,
        bool isActive
    );

    function getMilestone(
        uint256 projectId,
        uint256 milestoneId
    ) external view returns (
        string memory description,
        uint256 amount,
        uint256 deadline,
        MilestoneStatus status,
        bool isPaid
    );
}