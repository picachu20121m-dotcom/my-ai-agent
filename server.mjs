import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ethers } from "ethers";

dotenv.config();

const app = express();
app.use(express.json());

// 1. Gemini AI Setup (Using gemini-1.5-flash for stability)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 2. Base Network Provider & Wallet Setup
const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);

console.log("==========================================");
console.log(`AGENT LIVE WALLET ADDRESS: ${wallet.address}`);
console.log("==========================================");

// 3. Simple Payment Check Endpoint ($0.10 USDT verification)
app.post("/api/v1/task", async (req, res) => {
  try {
    const { prompt, txHash } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Client must send payment transaction hash to execute
    if (!txHash) {
      return res.status(402).json({
        error: "Payment Required",
        price: "0.10 USDT",
        payToAddress: wallet.address,
        network: "Base Mainnet"
      });
    }

    // Verify transaction on Base blockchain
    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.to || tx.to.toLowerCase() !== wallet.address.toLowerCase()) {
      return res.status(400).json({ error: "Invalid payment transaction" });
    }

    // Run AI task after verification
    const result = await model.generateContent(prompt);
    
    res.json({
      success: true,
      result: result.response.text(),
      paidTo: wallet.address
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Agent running on port ${PORT}`));