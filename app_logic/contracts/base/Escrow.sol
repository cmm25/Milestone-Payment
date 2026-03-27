// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/MilestoneInterface.sol";
import "../libraries/MilestoneLib.sol";

abstract contract EscrowBase is 
    ReentrancyGuard, 
    Ownable, 
    Pausable, 
    IMilestoneEscrow 
{
    error NotAuthorized(address caller);
    error ProjectNotFound(uint256 projectId);
    error MilestoneNotFound(uint256 projectId, uint256 milestoneId);
    error TransferFailed();

    // milestoneCount removed — _milestones[projectId].length
    // gives us the same value with no risk of going out of sync
    struct Project {
        address client;
        address freelancer;
        uint256 totalBudget;
        uint256 remainingBudget;
        bool isActive;
    }

    struct Milestone {
        string description;
        uint256 amount;
        uint256 deadline;
        MilestoneStatus status;
        bool isPaid;
    }

    uint256 internal _projectCounter;
    mapping(uint256 => Project) internal _projects;
    mapping(uint256 => Milestone[]) internal _milestones;

    constructor(address initialOwner) Ownable(initialOwner) {}

    modifier onlyClient(uint256 projectId) {
        if (msg.sender != _projects[projectId].client)
            revert NotAuthorized(msg.sender);
        _;
    }

    modifier onlyFreelancer(uint256 projectId) {
        if (msg.sender != _projects[projectId].freelancer)
            revert NotAuthorized(msg.sender);
        _;
    }

    modifier projectExists(uint256 projectId) {
        if (!_projects[projectId].isActive)
            revert ProjectNotFound(projectId);
        _;
    }

    modifier milestoneExists(uint256 projectId, uint256 milestoneId) {
        if (milestoneId >= _milestones[projectId].length)
            revert MilestoneNotFound(projectId, milestoneId);
        _;
    }

    // --- Owner controls ---

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // --- Internal helpers ---

    // Checks if every milestone in a project has been
    // either approved or expired — nothing left unresolved
    function _allMilestonesResolved(
        uint256 projectId
    ) internal view returns (bool) {
        for (uint256 i = 0; i < _milestones[projectId].length; i++) {
            MilestoneStatus s = _milestones[projectId][i].status;
            if (s != MilestoneStatus.APPROVED &&
                s != MilestoneStatus.EXPIRED) {
                return false;
            }
        }
        return true;
    }

    // Single place for all RBTC transfers
    // keeps transfer logic and error handling in one spot
    function _transferFunds(
        address to,
        uint256 amount
    ) internal {
        (bool success, ) = payable(to).call{value: amount}("");
        if (!success) revert TransferFailed();
    }
}