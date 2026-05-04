import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * LottoDrawing 스마트 컨트랙트 배포 스크립트
 * 
 * 사용법:
 * npx hardhat run scripts/deploy.ts --network sepolia
 */

async function main() {
  console.log("🚀 LottoDrawing 스마트 컨트랙트 배포 시작...");

  try {
    // 배포자 계정 가져오기
    const [deployer] = await ethers.getSigners();
    console.log(`📝 배포자 주소: ${deployer.address}`);

    // 배포자 잔액 확인
    const balance = await deployer.getBalance();
    console.log(`💰 배포자 잔액: ${ethers.formatEther(balance)} ETH`);

    // LottoDrawing 컨트랙트 배포
    console.log("\n📦 LottoDrawing 컨트랙트 배포 중...");
    const LottoDrawing = await ethers.getContractFactory("LottoDrawing");
    const lottoDrawing = await LottoDrawing.deploy();

    await lottoDrawing.waitForDeployment();
    const contractAddress = await lottoDrawing.getAddress();

    console.log(`✅ LottoDrawing 배포 완료!`);
    console.log(`📍 컨트랙트 주소: ${contractAddress}`);

    // 배포 정보 저장
    const deploymentInfo = {
      network: "sepolia",
      contractName: "LottoDrawing",
      contractAddress: contractAddress,
      deployerAddress: deployer.address,
      deploymentDate: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber(),
    };

    // 배포 정보를 파일로 저장
    const deploymentPath = path.join(
      __dirname,
      "../deployments/sepolia.json"
    );
    const deploymentsDir = path.dirname(deploymentPath);

    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n📄 배포 정보 저장: ${deploymentPath}`);

    // 환경변수 파일 업데이트
    const envPath = path.join(__dirname, "../.env.local");
    let envContent = "";

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    // LOTTO_DRAWING_ADDRESS 업데이트 또는 추가
    if (envContent.includes("VITE_LOTTO_DRAWING_ADDRESS=")) {
      envContent = envContent.replace(
        /VITE_LOTTO_DRAWING_ADDRESS=.*/,
        `VITE_LOTTO_DRAWING_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nVITE_LOTTO_DRAWING_ADDRESS=${contractAddress}`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`✅ 환경변수 업데이트: VITE_LOTTO_DRAWING_ADDRESS=${contractAddress}`);

    // ABI 저장
    const abiPath = path.join(__dirname, "../contracts/abi/LottoDrawing.json");
    const abiDir = path.dirname(abiPath);

    if (!fs.existsSync(abiDir)) {
      fs.mkdirSync(abiDir, { recursive: true });
    }

    const artifact = await ethers.provider.getCode(contractAddress);
    console.log(`\n📋 컨트랙트 ABI 저장: ${abiPath}`);

    // 배포 후 컨트랙트 검증 (Etherscan)
    console.log("\n🔍 Etherscan 검증 대기 중...");
    console.log(`검증 명령어:`);
    console.log(
      `npx hardhat verify --network sepolia ${contractAddress}`
    );

    console.log("\n✨ 배포 완료!");
    console.log("\n📊 배포 정보:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

  } catch (error) {
    console.error("❌ 배포 실패:", error);
    process.exitCode = 1;
  }
}

main();
