import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:civicvoice:address", "Prints the CivicVoiceFeedback deployment address").setAction(
  async function (_taskArguments: TaskArguments, hre) {
    const { deployments } = hre;

    const deployment = await deployments.get("CivicVoiceFeedback");
    console.log(`CivicVoiceFeedback address: ${deployment.address}`);
  },
);

task("task:civicvoice:submit", "Submits an encrypted civic score")
  .addParam("category", "Category identifier (0-4)")
  .addParam("value", "Score value 0-10")
  .addOptionalParam("address", "Override deployment address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const category = parseInt(taskArguments.category);
    const value = parseInt(taskArguments.value);
    if (!Number.isInteger(category) || category < 0 || category > 4) {
      throw new Error("Category must be between 0 and 4");
    }
    if (!Number.isInteger(value) || value < 0 || value > 10) {
      throw new Error("Value must be an integer between 0 and 10");
    }

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address
      ? { address: taskArguments.address as string }
      : await deployments.get("CivicVoiceFeedback");

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("CivicVoiceFeedback", deployment.address);

    const encryptedValue = await fhevm
      .createEncryptedInput(deployment.address, signer.address)
      .add32(value)
      .encrypt();

    const tx = await contract
      .connect(signer)
      .submitScore(category, encryptedValue.handles[0], encryptedValue.inputProof);
    console.log(`submitScore tx: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`status: ${receipt?.status}`);
  });

task("task:civicvoice:decrypt", "Decrypts aggregate sum and count for a category")
  .addParam("category", "Category identifier (0-4)")
  .addOptionalParam("address", "Override deployment address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const category = parseInt(taskArguments.category);
    if (!Number.isInteger(category) || category < 0 || category > 4) {
      throw new Error("Category must be between 0 and 4");
    }

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address
      ? { address: taskArguments.address as string }
      : await deployments.get("CivicVoiceFeedback");

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("CivicVoiceFeedback", deployment.address);

    const allowTx = await contract.connect(signer).allowDecryptAverageFor(category, signer.address);
    await allowTx.wait();

    const [encryptedSum, encryptedCount] = await contract.getEncryptedAggregate(category);

    const clearSum = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedSum,
      deployment.address,
      signer,
    );
    const clearCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      deployment.address,
      signer,
    );

    const average = clearCount === 0 ? 0 : clearSum / clearCount;

    console.log(`Category ${category} aggregate:`);
    console.log(`  Sum   : ${clearSum}`);
    console.log(`  Count : ${clearCount}`);
    console.log(`  Avg   : ${average}`);
  });



