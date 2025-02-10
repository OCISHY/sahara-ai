const { ethers } = require("ethers");
const fs = require("fs");
const { HttpsProxyAgent } = require("https-proxy-agent");

const RPC = "https://testnet.saharalabs.ai";
const CHAIN_ID = 313313;

// Amount range configuration (in SAHARA)
const MIN_AMOUNT = 0.00001;
const MAX_AMOUNT = 0.001;

// Function to generate random amount between MIN and MAX
function getRandomAmount() {
  // 生成随机数
  let randomNum = Math.random() * (MAX_AMOUNT - MIN_AMOUNT) + MIN_AMOUNT;
  // 随机选择保留的小数位数（4到6位）
  const decimalPlaces = Math.floor(Math.random() * 3) + 4;
  // 格式化为指定的小数位数的字符串
  let ammout = randomNum.toFixed(decimalPlaces);
  if (parseFloat(ammout) === 0) {
    ammout = "0.0001";
  }
  const wei = ethers.parseEther(ammout);

  const randomBigInt = BigInt(Math.floor(Number(wei)));
  return randomBigInt;
}

// Load private keys and proxies from txt files
const accountFile = "account.txt";
const proxyFile = "proxy.txt";

async function sendTransactionFromWallet(privateKey, proxy) {
  try {
    // Create provider with proxy
    const fetchOptions = {
      agent: new HttpsProxyAgent(proxy),
    };

    // Initialize provider with proxy
    const provider = new ethers.JsonRpcProvider({
      url: RPC,
      fetchOptions,
    });

    // Create wallet
    const wallet = new ethers.Wallet(privateKey, provider);

    // Generate random wallet for recipient
    const randomWallet = ethers.Wallet.createRandom();

    // Get random amount
    // const randomAmount = getRandomAmount();
    const randomAmount = randomWallet.address;

    // Create and send transaction
    const tx = {
      to: randomWallet.address,
      value: randomAmount,
      chainId: CHAIN_ID,
    };

    const transactionResponse = await wallet.sendTransaction(tx);
    console.log(
      `Your wallet address: ${wallet.address} Sent to address: ${randomWallet.address}`
    );
    console.log(`Amount sent: ${ethers.formatEther(randomAmount)} SAHARA`);
    console.log(`Using proxy: ${proxy}`);
    console.log(`Hash: ${transactionResponse.hash}`);

    // Wait for transaction to be mined
    const receipt = await transactionResponse.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
  } catch (error) {
    console.error("Error sending transaction:", error);
  }
}

async function main() {
  const privateKeys = fs
    .readFileSync(accountFile, "utf-8")
    .split("\n")
    .map((key) => key.trim())
    .filter((key) => key.length > 0);

  const proxies = fs
    .readFileSync(proxyFile, "utf-8")
    .split("\n")
    .map((proxy) => proxy.trim())
    .filter((proxy) => proxy.length > 0);

  // Check if we have matching number of proxies and accounts
  if (privateKeys.length !== proxies.length) {
    console.error("Number of private keys and proxies don't match!");
    return;
  }

  for (let i = 0; i < privateKeys.length; i++) {
    await sendTransactionFromWallet(privateKeys[i], proxies[i]);
  }

  if (privateKeys.length === 0) {
    console.log("All wallets have sent their transactions.");
  }
}

main();
