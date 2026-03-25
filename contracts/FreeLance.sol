// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./base/Escrow.sol";

contract FreelanceEscrow is EscrowBase {

    constructor(address initialOwner) EscrowBase(initialOwner) {}

    function createProject(
        address freelancer,
        string[] calldata descriptions,
        uint256[] calldata amounts,
        uint256[] calldata deadlines
    ) external payable whenNotPaused returns (uint256) {

        // checks
        MilestoneLib.validateArrays(descriptions, amounts, deadlines);
        MilestoneLib.validateBudget(msg.value, amounts);
        require(freelancer != address(0), "Invalid freelancer address");
        require(freelancer != msg.sender, "Cannot be your own freelancer");

        _projectCounter++;
        uint256 projectId = _projectCounter;

        _projects[projectId] = Project({
            client: msg.sender,
            freelancer: freelancer,
            totalBudget: msg.value,
            remainingBudget: msg.value,
            isActive: true
        });

        for (uint256 i = 0; i < descriptions.length; i++) {
            MilestoneLib.validateDeadline(deadlines[i]);
            _milestones[projectId].push(Milestone({
                description: descriptions[i],
                amount: amounts[i],
                deadline: deadlines[i],
                status: MilestoneStatus.PENDING,
                isPaid: false
            }));
        }

        // interactions
        emit ProjectCreated(
            projectId,
            msg.sender,
            freelancer,
            msg.value,
            descriptions.length
        );

        return projectId;
    }

    function submitMilestone(
        uint256 projectId,
        uint256 milestoneId
    )
        external
        whenNotPaused
        projectExists(projectId)
        milestoneExists(projectId, milestoneId)
        onlyFreelancer(projectId)
    {
        // status check inline — clear and consistent
        require(
            _milestones[projectId][milestoneId].status == MilestoneStatus.PENDING,
            "Milestone not pending"
        );

        _milestones[projectId][milestoneId].status = MilestoneStatus.SUBMITTED;

        emit MilestoneSubmitted(projectId, milestoneId);
    }

    function approveMilestone(
        uint256 projectId,
        uint256 milestoneId
    )
        external
        nonReentrant
        whenNotPaused
        projectExists(projectId)
        milestoneExists(projectId, milestoneId)
        onlyClient(projectId)
    {
        // status check inline
        require(
            _milestones[projectId][milestoneId].status == MilestoneStatus.SUBMITTED,
            "Milestone not submitted"
        );

        Milestone storage milestone = _milestones[projectId][milestoneId];
        uint256 payment = milestone.amount;

        // effects
        milestone.status = MilestoneStatus.APPROVED;
        milestone.isPaid = true;
        _projects[projectId].remainingBudget -= payment;

        // clean one-liner now instead of an inline loop
        if (_allMilestonesResolved(projectId)) {
            _projects[projectId].isActive = false;
            emit ProjectCompleted(projectId);
        }

        // interactions
        _transferFunds(_projects[projectId].freelancer, payment);
        emit MilestoneApproved(projectId, milestoneId, payment);
    }

    function claimExpired(
        uint256 projectId,
        uint256 milestoneId
    )
        external
        nonReentrant
        whenNotPaused
        projectExists(projectId)
        milestoneExists(projectId, milestoneId)
        onlyClient(projectId)
    {
        Milestone storage milestone = _milestones[projectId][milestoneId];

        // status check inline — needs two valid statuses so
        // inline require was always the right pattern here
        require(
            milestone.status == MilestoneStatus.PENDING ||
            milestone.status == MilestoneStatus.SUBMITTED,
            "Milestone already resolved"
        );

        require(
            MilestoneLib.isExpired(milestone.deadline, block.timestamp),
            "Deadline has not passed"
        );

        uint256 refund = milestone.amount;

        // effects
        milestone.status = MilestoneStatus.EXPIRED;
        milestone.isPaid = true;
        _projects[projectId].remainingBudget -= refund;

        if (_allMilestonesResolved(projectId)) {
            _projects[projectId].isActive = false;
            emit ProjectCompleted(projectId);
        }

        // interactions
        _transferFunds(_projects[projectId].client, refund);
        emit MilestoneExpired(projectId, milestoneId, refund);
    }

    function getProject(
        uint256 projectId
    ) external view returns (
        address client,
        address freelancer,
        uint256 totalBudget,
        uint256 remainingBudget,
        uint256 milestoneCount,
        bool isActive
    ) {
        Project storage p = _projects[projectId];
        return (
            p.client,
            p.freelancer,
            p.totalBudget,
            p.remainingBudget,
            _milestones[projectId].length, // single source of truth
            p.isActive
        );
    }

    function getMilestone(
        uint256 projectId,
        uint256 milestoneId
    ) external view returns (
        string memory description,
        uint256 amount,
        uint256 deadline,
        MilestoneStatus status,
        bool isPaid
    ) {
        Milestone storage m = _milestones[projectId][milestoneId];
        return (
            m.description,
            m.amount,
            m.deadline,
            m.status,
            m.isPaid
        );
    }
}