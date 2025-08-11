const {deployments, ethers, getNamedAccounts} = require("hardhat");
const {expect} = require("chai");
let myMemeToken;
before(async function () { 
    console.log("deploying...")
    await deployments.fixture(["all"]);
    console.log("deployed")
    console.log("testing...")
    const {firstAccount, secondAccount, thirdAccount} = await getNamedAccounts();
    const lp = await ethers.getContract("LiquidityPool", firstAccount);
    console.log("lp deployed to:", lp.target);

    myMemeToken = await ethers.getContract("MyMemeToken", firstAccount);
    myMemeToken.approve(lp.target, ethers.parseEther("500000"));
    
    //调用下面函数时带上value，转入eth到这个合约
    console.log("balanceOf lp before:", await myMemeToken.balanceOf(lp.target))
    await lp.initLP({value: ethers.parseEther("10")})
    console.log("balanceOf lp after:", await myMemeToken.balanceOf(lp.target))
});

describe("MyMeme", async function () { 
    it("buy meme", async function () { 
        const {firstAccount, secondAccount, thirdAccount} = await getNamedAccounts();
        const userConnLp = await ethers.getContract("LiquidityPool", thirdAccount);
        
        console.log("eth reserve before:", await userConnLp.lpEthReserve())
        await userConnLp.buyMeme({value: ethers.parseEther("1")})
        console.log("eth reserve after:", await userConnLp.lpEthReserve())
        console.log("balanceOf:", await myMemeToken.balanceOf(userConnLp.target))
        const userMemeBalance = await myMemeToken.balanceOf(thirdAccount)
        console.log("userMemeBalance:", userMemeBalance)
        expect(userMemeBalance).to.be.greaterThan(0)
    })

    it("sell meme", async function () {

        // sleep
        await new Promise(resolve => setTimeout(resolve, 10000));
        const {thirdAccount} = await getNamedAccounts();
        const userConnLp = await ethers.getContract("LiquidityPool", thirdAccount) 
        const userMeme = await ethers.getContract("MyMemeToken", thirdAccount)
        await userMeme.approve(userConnLp.target, ethers.parseEther("1"))

        const userMemeBalance = await userMeme.balanceOf(thirdAccount)
        console.log("balanceOf before:", await userMeme.balanceOf(thirdAccount))
        await userConnLp.sellMeme(ethers.parseEther("1"))
        console.log("balanceOf after:", await userMeme.balanceOf(thirdAccount))
        const sellAmount = userMemeBalance - await userMeme.balanceOf(thirdAccount)
        expect(sellAmount).to.be.equal(ethers.parseEther("1"))
    })

    it("removeLiquidity", async function () { 
        
    })
});