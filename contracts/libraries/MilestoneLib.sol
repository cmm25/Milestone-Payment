// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library MilestoneLib {

    error DeadlineMustBeFuture(uint256 provided, uint256 current);
    error DeadlineTooFar(uint256 provided, uint256 maximum);
    error AmountMustBePositive();
    error DescriptionEmpty();
    error ArrayLengthMismatch(uint256 lengthA, uint256 lengthB);
    error BudgetMismatch(uint256 sent, uint256 required);

    uint256 internal constant MIN_DEADLINE_BUFFER = 1 hours;
    uint256 internal constant MAX_DEADLINE_DAYS = 365 days;

    function validateArrays(
        string[] calldata descriptions,
        uint256[] calldata amounts,
        uint256[] calldata deadlines
    ) internal pure {
        if (descriptions.length == 0) revert DescriptionEmpty();
        if (descriptions.length != amounts.length)
            revert ArrayLengthMismatch(descriptions.length, amounts.length);
        if (amounts.length != deadlines.length)
            revert ArrayLengthMismatch(amounts.length, deadlines.length);
    }

    function validateBudget(
        uint256 sent,
        uint256[] calldata amounts
    ) internal pure {
        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            if (amounts[i] == 0) revert AmountMustBePositive();
            total += amounts[i];
        }
        if (sent != total) revert BudgetMismatch(sent, total);
    }

    function validateDeadline(uint256 deadline) internal view {
        if (deadline < block.timestamp + MIN_DEADLINE_BUFFER)
            revert DeadlineMustBeFuture(deadline, block.timestamp);
        if (deadline > block.timestamp + MAX_DEADLINE_DAYS)
            revert DeadlineTooFar(deadline, block.timestamp + MAX_DEADLINE_DAYS);
    }

    function isExpired(
        uint256 deadline,
        uint256 currentTime
    ) internal pure returns (bool) {
        return currentTime > deadline;
    }
}