import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { CivicVoiceFeedback, CivicVoiceFeedback__factory } from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployCivicVoice() {
  const factory = (await ethers.getContractFactory("CivicVoiceFeedback")) as CivicVoiceFeedback__factory;
  const contract = (await factory.deploy()) as CivicVoiceFeedback;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("CivicVoiceFeedback", function () {
  let signers: Signers;
  let contract: CivicVoiceFeedback;
  let contractAddress: string;

  before(async function () {
    const [deployer, alice, bob] = await ethers.getSigners();
    signers = { deployer, alice, bob };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("CivicVoiceFeedback tests require the FHEVM mock environment");
      this.skip();
    }

    ({ contract, contractAddress } = await deployCivicVoice());
  });

  async function decryptAggregate(categoryId: number, grantee: HardhatEthersSigner) {
    const tx = await contract.connect(signers.deployer).allowDecryptAverageFor(categoryId, grantee.address);
    await tx.wait();

    const [encryptedSum, encryptedCount] = await contract.getEncryptedAggregate(categoryId);

    const clearSum = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedSum,
      contractAddress,
      grantee,
    );
    const clearCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      contractAddress,
      grantee,
    );

    return { clearSum, clearCount };
  }

  it("initializes encrypted aggregates to zero", async function () {
    const { clearSum, clearCount } = await decryptAggregate(0, signers.alice);

    expect(clearSum).to.equal(0);
    expect(clearCount).to.equal(0);
  });

  it("accepts encrypted submissions and updates aggregates", async function () {
    const clearScore = 7;

    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(clearScore)
      .encrypt();

    const tx = await contract
      .connect(signers.alice)
      .submitScore(0, encryptedInput.handles[0], encryptedInput.inputProof);
    await tx.wait();

    const { clearSum, clearCount } = await decryptAggregate(0, signers.alice);

    expect(clearSum).to.equal(clearScore);
    expect(clearCount).to.equal(1);
  });

  it("aggregates multiple submissions across contributors", async function () {
    const aliceScore = 8;
    const bobScore = 6;

    const aliceEncrypted = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(aliceScore)
      .encrypt();

    const bobEncrypted = await fhevm.createEncryptedInput(contractAddress, signers.bob.address).add32(bobScore).encrypt();

    await (await contract
      .connect(signers.alice)
      .submitScore(2, aliceEncrypted.handles[0], aliceEncrypted.inputProof)).wait();
    await (await contract
      .connect(signers.bob)
      .submitScore(2, bobEncrypted.handles[0], bobEncrypted.inputProof)).wait();

    const { clearSum, clearCount } = await decryptAggregate(2, signers.alice);

    expect(clearSum).to.equal(aliceScore + bobScore);
    expect(clearCount).to.equal(2);
  });

  it("grants decrypt permission for all categories", async function () {
    const deployment = await contract.getAddress();
    const categories = Array.from({ length: 5 }, (_, idx) => idx);
    await contract.allowDecryptAll(signers.alice.address);

    for (const category of categories) {
      const [sumHandle, countHandle] = await contract.getEncryptedAggregate(category);

      const sum = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        sumHandle,
        deployment,
        signers.alice,
      );
      const count = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        countHandle,
        deployment,
        signers.alice,
      );

      expect(sum).to.equal(0);
      expect(count).to.equal(0);
    }
  });

  it("rejects submissions for invalid categories", async function () {
    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(5)
      .encrypt();

    await expect(
      contract.connect(signers.alice).submitScore(9, encryptedInput.handles[0], encryptedInput.inputProof),
    ).to.be.revertedWith("CivicVoice: invalid category");
  });
});


