// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title CivicVoiceFeedback
/// @notice FHE-enabled contract that aggregates encrypted civic satisfaction scores per service category
contract CivicVoiceFeedback is ZamaEthereumConfig {
    /// @notice Supported civic service categories
    enum Category {
        Transportation,
        Utilities,
        Safety,
        Sanitation,
        Custom
    }

    uint8 public constant CATEGORY_COUNT = 5;

    mapping(uint8 => euint32) private _encryptedSums;
    mapping(uint8 => euint32) private _encryptedCounts;
    mapping(uint8 => bool) private _categoryInitialized;

    event ScoreSubmitted(address indexed author, uint8 indexed categoryId);
    event AggregateUpdated(uint8 indexed categoryId);
    event AverageDecryptionRequested(uint8 indexed categoryId, address indexed requester, address indexed grantee);
    event AllAveragesDecryptionRequested(address indexed requester, address indexed grantee);

    constructor() {
        for (uint8 category = 0; category < CATEGORY_COUNT; category++) {
            _bootstrapCategory(category);
        }
    }

    /// @notice Submit an encrypted satisfaction score for a category
    /// @param categoryId The civic service category identifier
    /// @param encryptedScore The encrypted score handle
    /// @param inputProof The zk-proof accompanying the encrypted input
    function submitScore(uint8 categoryId, externalEuint32 encryptedScore, bytes calldata inputProof) external {
        _requireValidCategory(categoryId);

        euint32 score = FHE.fromExternal(encryptedScore, inputProof);

        _encryptedSums[categoryId] = FHE.add(_encryptedSums[categoryId], score);
        _reenableContractAccess(_encryptedSums[categoryId]);

        euint32 one = FHE.asEuint32(1);
        _encryptedCounts[categoryId] = FHE.add(_encryptedCounts[categoryId], one);
        _reenableContractAccess(_encryptedCounts[categoryId]);

        emit ScoreSubmitted(msg.sender, categoryId);
        emit AggregateUpdated(categoryId);
    }

    /// @notice Returns encrypted aggregate sum and count for a category
    /// @param categoryId The civic service category identifier
    /// @return encryptedSum The encrypted cumulative score
    /// @return encryptedCount The encrypted submission count
    function getEncryptedAggregate(uint8 categoryId) external view returns (euint32 encryptedSum, euint32 encryptedCount) {
        _requireValidCategory(categoryId);
        return (_encryptedSums[categoryId], _encryptedCounts[categoryId]);
    }

    /// @notice Allows the caller to decrypt the aggregate score for a category
    /// @param categoryId The civic service category identifier
    function allowDecryptAverage(uint8 categoryId) external {
        _allowDecryptAverage(categoryId, msg.sender);
    }

    /// @notice Grants aggregate decryption to a designated grantee (relayer/oracle)
    /// @param categoryId The civic service category identifier
    /// @param grantee Address that should be granted decryption rights
    function allowDecryptAverageFor(uint8 categoryId, address grantee) external {
        _allowDecryptAverage(categoryId, grantee);
    }

    /// @notice Grants aggregate decryption for every category to a designated grantee
    /// @param grantee Address that should be granted decryption rights for all categories
    function allowDecryptAll(address grantee) external {
        require(grantee != address(0), "CivicVoice: invalid grantee");
        for (uint8 category = 0; category < CATEGORY_COUNT; category++) {
            FHE.allow(_encryptedSums[category], grantee);
            FHE.allow(_encryptedCounts[category], grantee);
        }
        emit AllAveragesDecryptionRequested(msg.sender, grantee);
    }

    function _allowDecryptAverage(uint8 categoryId, address grantee) internal {
        _requireValidCategory(categoryId);
        require(grantee != address(0), "CivicVoice: invalid grantee");

        FHE.allow(_encryptedSums[categoryId], grantee);
        FHE.allow(_encryptedCounts[categoryId], grantee);

        emit AverageDecryptionRequested(categoryId, msg.sender, grantee);
    }

    function _requireValidCategory(uint8 categoryId) private view {
        require(categoryId < CATEGORY_COUNT, "CivicVoice: invalid category");
        require(_categoryInitialized[categoryId], "CivicVoice: category inactive");
    }

    function _bootstrapCategory(uint8 categoryId) private {
        if (_categoryInitialized[categoryId]) {
            return;
        }

        _encryptedSums[categoryId] = FHE.asEuint32(0);
        _encryptedCounts[categoryId] = FHE.asEuint32(0);

        _reenableContractAccess(_encryptedSums[categoryId]);
        _reenableContractAccess(_encryptedCounts[categoryId]);

        _categoryInitialized[categoryId] = true;
    }

    function _reenableContractAccess(euint32 cipher) private {
        FHE.allowThis(cipher);
    }
}



