const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AICourtSettlement", function () {
  let contract;
  let owner, plaintiff, defendant, judge;
  let courtTreasury, juryPool, precedentFund;

  beforeEach(async function () {
    [owner, plaintiff, defendant, judge, courtTreasury, juryPool, precedentFund] = 
      await ethers.getSigners();

    const AICourtSettlement = await ethers.getContractFactory("AICourtSettlement");
    contract = await AICourtSettlement.deploy(
      courtTreasury.address,
      juryPool.address,
      precedentFund.address
    );
    await contract.waitForDeployment();

    // Authorize judge
    await contract.authorizeJudge(judge.address);
  });

  describe("Case Filing", function () {
    it("Should file a case with correct fee", async function () {
      const filingFee = ethers.parseEther("0.01");
      
      await expect(
        contract.connect(plaintiff).fileCase(
          defendant.address,
          "API_FRAUD",
          "QmTestEvidenceHash",
          ethers.parseEther("1"),
          { value: filingFee }
        )
      ).to.emit(contract, "CaseFiled");
      
      const caseData = await contract.getCase(1);
      expect(caseData.plaintiff).to.equal(plaintiff.address);
      expect(caseData.defendant).to.equal(defendant.address);
    });

    it("Should reject insufficient filing fee", async function () {
      await expect(
        contract.connect(plaintiff).fileCase(
          defendant.address,
          "API_FRAUD",
          "QmTestEvidenceHash",
          ethers.parseEther("1"),
          { value: ethers.parseEther("0.005") }
        )
      ).to.be.revertedWith("Insufficient filing fee");
    });
  });

  describe("Judgment", function () {
    beforeEach(async function () {
      const filingFee = ethers.parseEther("0.01");
      await contract.connect(plaintiff).fileCase(
        defendant.address,
        "API_FRAUD",
        "QmTestEvidenceHash",
        ethers.parseEther("1"),
        { value: filingFee }
      );
    });

    it("Should submit judgment as authorized judge", async function () {
      await expect(
        contract.connect(judge).submitJudgment(
          1,
          true,
          ethers.parseEther("0.5"),
          "QmTestVerdictHash"
        )
      ).to.emit(contract, "CaseJudged");
      
      const caseData = await contract.getCase(1);
      expect(caseData.guilty).to.be.true;
      expect(caseData.awardedDamages).to.equal(ethers.parseEther("0.5"));
    });

    it("Should reject judgment from unauthorized address", async function () {
      await expect(
        contract.connect(plaintiff).submitJudgment(
          1,
          true,
          ethers.parseEther("0.5"),
          "QmTestVerdictHash"
        )
      ).to.be.revertedWith("Not authorized judge");
    });
  });
});