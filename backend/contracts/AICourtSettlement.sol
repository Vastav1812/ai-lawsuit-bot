// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract AICourtSettlement is ReentrancyGuard, Ownable, Pausable {
    // Case status enum
    enum CaseStatus { Filed, UnderReview, Judged, Settled, Appealed, Dismissed }
    
    // Case structure
    struct Case {
        uint256 id;
        address plaintiff;
        address defendant;
        string claimType;
        string evidenceHash; // IPFS hash of evidence
        uint256 requestedDamages;
        uint256 awardedDamages;
        uint256 filingFee;
        uint256 filedAt;
        uint256 settledAt;
        CaseStatus status;
        string verdictHash; // IPFS hash of AI judgment
        bool guilty;
    }
    
    // Precedent structure
    struct Precedent {
        uint256 caseId;
        string precedentHash;
        uint256 citationCount;
        uint256 accessFee;
        address originalPlaintiff;
    }
    
    // State variables
    uint256 public caseCounter;
    uint256 public constant FILING_FEE = 0.01 ether;
    uint256 public constant APPEAL_FEE = 0.025 ether;
    uint256 public constant PRECEDENT_ACCESS_FEE = 0.0005 ether;
    
    // Fee distribution percentages (out of 1000)
    uint256 public constant COURT_FEE_PERCENT = 150; // 15%
    uint256 public constant JURY_POOL_PERCENT = 50;  // 5%
    uint256 public constant PRECEDENT_FUND_PERCENT = 50; // 5%
    
    // Treasury addresses
    address public courtTreasury;
    address public juryPool;
    address public precedentFund;
    
    // Mappings
    mapping(uint256 => Case) public cases;
    mapping(uint256 => Precedent) public precedents;
    mapping(address => uint256[]) public plaintiffCases;
    mapping(address => uint256[]) public defendantCases;
    mapping(address => bool) public authorizedJudges; // AI judge addresses
    
    // Events
    event CaseFiled(
        uint256 indexed caseId,
        address indexed plaintiff,
        address indexed defendant,
        string claimType,
        uint256 requestedDamages
    );
    
    event CaseJudged(
        uint256 indexed caseId,
        bool guilty,
        uint256 awardedDamages,
        string verdictHash
    );
    
    event CaseSettled(
        uint256 indexed caseId,
        uint256 totalAmount,
        uint256 timestamp
    );
    
    event PrecedentCreated(
        uint256 indexed caseId,
        string precedentHash,
        uint256 accessFee
    );
    
    event PrecedentAccessed(
        uint256 indexed precedentId,
        address indexed accessor,
        uint256 fee
    );
    
    // Constructor
    constructor(
        address _courtTreasury,
        address _juryPool,
        address _precedentFund
    ) Ownable(msg.sender) {
        require(_courtTreasury != address(0), "Invalid treasury");
        require(_juryPool != address(0), "Invalid jury pool");
        require(_precedentFund != address(0), "Invalid precedent fund");
        
        courtTreasury = _courtTreasury;
        juryPool = _juryPool;
        precedentFund = _precedentFund;
    }
    
    // File a new case
    function fileCase(
        address _defendant,
        string memory _claimType,
        string memory _evidenceHash,
        uint256 _requestedDamages
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        require(msg.value >= FILING_FEE, "Insufficient filing fee");
        require(_defendant != address(0), "Invalid defendant");
        require(_defendant != msg.sender, "Cannot sue yourself");
        require(bytes(_claimType).length > 0, "Claim type required");
        require(bytes(_evidenceHash).length > 0, "Evidence required");
        require(_requestedDamages > 0, "Damages must be positive");
        
        caseCounter++;
        uint256 caseId = caseCounter;
        
        cases[caseId] = Case({
            id: caseId,
            plaintiff: msg.sender,
            defendant: _defendant,
            claimType: _claimType,
            evidenceHash: _evidenceHash,
            requestedDamages: _requestedDamages,
            awardedDamages: 0,
            filingFee: msg.value,
            filedAt: block.timestamp,
            settledAt: 0,
            status: CaseStatus.Filed,
            verdictHash: "",
            guilty: false
        });
        
        plaintiffCases[msg.sender].push(caseId);
        defendantCases[_defendant].push(caseId);
        
        // Distribute filing fee
        _distributeFees(msg.value);
        
        emit CaseFiled(caseId, msg.sender, _defendant, _claimType, _requestedDamages);
        
        return caseId;
    }
    
    // Submit judgment (only authorized AI judges)
    function submitJudgment(
        uint256 _caseId,
        bool _guilty,
        uint256 _awardedDamages,
        string memory _verdictHash
    ) external onlyAuthorizedJudge {
        Case storage courtCase = cases[_caseId];
        require(courtCase.id != 0, "Case not found");
        require(courtCase.status == CaseStatus.Filed || courtCase.status == CaseStatus.UnderReview, "Invalid case status");
        require(bytes(_verdictHash).length > 0, "Verdict hash required");
        
        if (_guilty) {
            require(_awardedDamages > 0, "Damages required for guilty verdict");
            require(_awardedDamages <= courtCase.requestedDamages, "Cannot award more than requested");
        } else {
            _awardedDamages = 0;
        }
        
        courtCase.status = CaseStatus.Judged;
        courtCase.guilty = _guilty;
        courtCase.awardedDamages = _awardedDamages;
        courtCase.verdictHash = _verdictHash;
        
        emit CaseJudged(_caseId, _guilty, _awardedDamages, _verdictHash);
        
        // Auto-settle if guilty (defendant must have deposited funds)
        if (_guilty && address(this).balance >= _awardedDamages) {
            _settleCase(_caseId);
        }
    }
    
    // Settle a judged case
    function settleCase(uint256 _caseId) external payable nonReentrant {
        Case storage courtCase = cases[_caseId];
        require(courtCase.id != 0, "Case not found");
        require(courtCase.status == CaseStatus.Judged, "Case not judged yet");
        require(courtCase.guilty, "Case not guilty");
        require(msg.sender == courtCase.defendant, "Only defendant can settle");
        require(msg.value >= courtCase.awardedDamages, "Insufficient settlement amount");
        
        _settleCase(_caseId);
    }
    
    // Internal settlement function
    function _settleCase(uint256 _caseId) internal {
        Case storage courtCase = cases[_caseId];
        uint256 totalAmount = courtCase.awardedDamages;
        
        // Calculate distributions
        uint256 courtFee = (totalAmount * COURT_FEE_PERCENT) / 1000;
        uint256 juryFee = (totalAmount * JURY_POOL_PERCENT) / 1000;
        uint256 precedentFee = (totalAmount * PRECEDENT_FUND_PERCENT) / 1000;
        uint256 plaintiffAmount = totalAmount - courtFee - juryFee - precedentFee;
        
        // Update case status
        courtCase.status = CaseStatus.Settled;
        courtCase.settledAt = block.timestamp;
        
        // Transfer funds
        payable(courtCase.plaintiff).transfer(plaintiffAmount);
        payable(courtTreasury).transfer(courtFee);
        payable(juryPool).transfer(juryFee);
        payable(precedentFund).transfer(precedentFee);
        
        emit CaseSettled(_caseId, totalAmount, block.timestamp);
    }
    
    // Create precedent from settled case
    function createPrecedent(
        uint256 _caseId,
        string memory _precedentHash,
        uint256 _accessFee
    ) external {
        Case memory courtCase = cases[_caseId];
        require(courtCase.id != 0, "Case not found");
        require(courtCase.status == CaseStatus.Settled, "Case not settled");
        require(msg.sender == courtCase.plaintiff || msg.sender == owner(), "Unauthorized");
        require(bytes(_precedentHash).length > 0, "Precedent hash required");
        require(_accessFee >= PRECEDENT_ACCESS_FEE, "Access fee too low");
        
        precedents[_caseId] = Precedent({
            caseId: _caseId,
            precedentHash: _precedentHash,
            citationCount: 0,
            accessFee: _accessFee,
            originalPlaintiff: courtCase.plaintiff
        });
        
        emit PrecedentCreated(_caseId, _precedentHash, _accessFee);
    }
    
    // Access precedent (requires payment)
    function accessPrecedent(uint256 _caseId) external payable returns (string memory) {
        Precedent storage precedent = precedents[_caseId];
        require(precedent.caseId != 0, "Precedent not found");
        require(msg.value >= precedent.accessFee, "Insufficient access fee");
        
        precedent.citationCount++;
        
        // Distribute access fee
        uint256 plaintiffShare = (msg.value * 300) / 1000; // 30% to original plaintiff
        uint256 courtShare = msg.value - plaintiffShare;
        
        payable(precedent.originalPlaintiff).transfer(plaintiffShare);
        payable(courtTreasury).transfer(courtShare);
        
        emit PrecedentAccessed(_caseId, msg.sender, msg.value);
        
        return precedent.precedentHash;
    }
    
    // Helper functions
    function _distributeFees(uint256 _amount) internal {
        uint256 courtFee = (_amount * 600) / 1000; // 60%
        uint256 juryFee = (_amount * 200) / 1000;  // 20%
        uint256 precedentFee = (_amount * 200) / 1000; // 20%
        
        payable(courtTreasury).transfer(courtFee);
        payable(juryPool).transfer(juryFee);
        payable(precedentFund).transfer(precedentFee);
    }
    
    // Admin functions
    function authorizeJudge(address _judge) external onlyOwner {
        authorizedJudges[_judge] = true;
    }
    
    function revokeJudge(address _judge) external onlyOwner {
        authorizedJudges[_judge] = false;
    }
    
    function updateTreasuries(
        address _courtTreasury,
        address _juryPool,
        address _precedentFund
    ) external onlyOwner {
        courtTreasury = _courtTreasury;
        juryPool = _juryPool;
        precedentFund = _precedentFund;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // View functions
    function getCase(uint256 _caseId) external view returns (Case memory) {
        return cases[_caseId];
    }
    
    function getPrecedent(uint256 _caseId) external view returns (Precedent memory) {
        return precedents[_caseId];
    }
    
    function getPlaintiffCases(address _plaintiff) external view returns (uint256[] memory) {
        return plaintiffCases[_plaintiff];
    }
    
    function getDefendantCases(address _defendant) external view returns (uint256[] memory) {
        return defendantCases[_defendant];
    }
    
    // Modifiers
    modifier onlyAuthorizedJudge() {
        require(authorizedJudges[msg.sender], "Not authorized judge");
        _;
    }
}