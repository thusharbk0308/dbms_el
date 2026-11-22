const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment of IPRegistry smart contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const IPRegistry = await hre.ethers.getContractFactory("IPRegistry");
  const ipRegistry = await IPRegistry.deploy();

  await ipRegistry.waitForDeployment();
  const contractAddress = await ipRegistry.getAddress();

  console.log("IPRegistry contract deployed successfully!");
  console.log("Contract Address:", contractAddress);

  // Read artifact to get contract ABI
  const artifactPath = path.join(__dirname, "../artifacts/contracts/IPRegistry.sol/IPRegistry.json");
  let contractABI = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    contractABI = artifact.abi;
  }

  // Save deployment metadata for backend integration
  const deploymentData = {
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: contractABI,
  };

  const outputPath = path.join(__dirname, "../deployed_contract.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
  console.log("Deployment information saved to:", outputPath);

  // Also save a copy for the backend if the backend directory exists
  const backendContractDataDir = path.join(__dirname, "../../backend/app/blockchain");
  if (!fs.existsSync(backendContractDataDir)) {
    fs.mkdirSync(backendContractDataDir, { recursive: true });
  }
  const backendOutputPath = path.join(backendContractDataDir, "deployed_contract.json");
  fs.writeFileSync(backendOutputPath, JSON.stringify(deploymentData, null, 2));
  console.log("Backend contract configuration updated at:", backendOutputPath);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
