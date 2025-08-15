const {expect, assert} = require("chai");
const {ethers, deployments} = require("hardhat");
const {mine, time} = require("@nomicfoundation/hardhat-network-helpers");
const { Signature } = require("ethers");


let metaNodeStakeContract;
let metaNodeContract;
let myStakeTokenAddress;
before("before all", async function () {
    await deployments.fixture("all");
    console.log("deploy successfully")
    const myStakeTokenDep = await deployments.get("MyStakeToken");
    myStakeTokenAddress = await myStakeTokenDep.address;
    console.log("myStakeTokenAddress: ", myStakeTokenAddress);
    const metaNodeStake = await deployments.get("MetaNodeStake");
    console.log("metaNodeStake address: ", metaNodeStake.address)
    metaNodeStakeContract = await ethers.getContractAt("MetaNodeStake", metaNodeStake.address);
    metaNodeContractDep = await deployments.get("MetaNodeToken");
    metaNodeContract = await ethers.getContractAt("MetaNodeToken", metaNodeContractDep.address);
});

describe("StakePool", async function () { 
    it("add eth pool success", async function () {
            await metaNodeStakeContract.addPool(ethers.ZeroAddress, 100, ethers.parseEther("1.0"), 200, true);
            const poolInfo = await metaNodeStakeContract.pool(0);
            console.log("poolInfo: ", poolInfo);
            assert.equal(poolInfo.stTokenAddress, ethers.ZeroAddress);
            assert.equal(poolInfo.minDepositAmount, ethers.parseEther("1.0"));
    });

    it("meta node upgrade success", async function () { 
        // console.log("out deployments: ", await deployments.all())
        await deployments.fixture("upgrade");
        const metaNodeStakeV2 = await deployments.get("MetaNodeStakeV2");
        console.log("metaNodeStakeV2 address: ", metaNodeStakeV2.address)
        metaNodeStakeContract = await ethers.getContractAt("MetaNodeStakeV2", metaNodeStakeV2.address);
        const poolInfo = await metaNodeStakeContract.pool(0);
        console.log("poolInfo: ", poolInfo)
        expect(poolInfo.stTokenAddress).to.equal(ethers.ZeroAddress);
        expect(await metaNodeStakeContract.version()).to.equal("v2.0.0");
    });

    it("add my stake token pool success", async function () { 
        await metaNodeStakeContract.addPool(myStakeTokenAddress, 100, ethers.parseEther("1.0"), 300, true);
            const poolInfo = await metaNodeStakeContract.pool(1);
            console.log("poolInfo: ", poolInfo);
            assert.equal(poolInfo.stTokenAddress, myStakeTokenAddress);
            assert.equal(poolInfo.minDepositAmount, ethers.parseEther("1.0"));
    })

    it("should stake eth", async function () {
        const {secondAccount} = await getNamedAccounts();
        
        await metaNodeStakeContract.connect(await ethers.getSigner(secondAccount)).depositETH({value: ethers.parseEther("1.0")});
        const latestBlock1 = await time.latestBlock();
        console.log(`latestBlock1: ${latestBlock1}`)
        await mine(10000)
        const stakeBalance = await metaNodeStakeContract.stakingBalance(0, secondAccount);
        console.log("stakeBalance: ", stakeBalance);
        const pendingMetaNode1 = await metaNodeStakeContract.pendingMetaNode(0, secondAccount);
        console.log("pendingMetaNode: ", pendingMetaNode1);
        const latestBlock2 = await time.latestBlock();
        console.log(`latestBlock2: ${latestBlock2}`)
        const poolInfo = await metaNodeStakeContract.pool(0);
        console.log("poolInfo: ", poolInfo);
        expect(stakeBalance).to.equal(ethers.parseEther("1.0"));
        expect(pendingMetaNode1).to.equal(ethers.parseEther("500.0"));
        // await metaNodeStakeContract.depositETH({value: ethers.parseEther("1.0")}); 

    });

    it("unstake", async function () { 
        const {secondAccount} = await getNamedAccounts();
        await metaNodeStakeContract.connect(await ethers.getSigner(secondAccount)).unstake(0, ethers.parseEther("0.5"))
        const stakeBalance = await metaNodeStakeContract.stakingBalance(0, secondAccount);
        console.log("stakeBalance: ", stakeBalance);
        expect(stakeBalance).to.equal(ethers.parseEther("0.5"));

        //mine 201 blocks, because the unlock blocks is 200, then the pending withdrawal amount will be 0.5
        mine(201)
        const {requestAmount, pendingWithdrawAmount} = await metaNodeStakeContract.withdrawAmount(0, secondAccount);
        console.log(`requesWithdraw: ${requestAmount}, pendingWithdraw: ${pendingWithdrawAmount}`)
        expect(requestAmount).to.equal(ethers.parseEther("0.5"));
        expect(pendingWithdrawAmount).to.equal(ethers.parseEther("0.5"));
    });

    it("withdraw", async function () {
        // after withdraw, the eth will be transfer to the secondaccount
        const {secondAccount} = await getNamedAccounts();
        const ethBalanceBefore = await ethers.provider.getBalance(secondAccount);
        console.log(`ethBalanceBefore: ${ethBalanceBefore}`)
        await metaNodeStakeContract.connect(await ethers.getSigner(secondAccount)).withdraw(0);
        const ethBalanceAfter = await ethers.provider.getBalance(secondAccount);
        console.log(`ethBalanceAfter: ${ethBalanceAfter}`)
        expect(ethBalanceAfter - ethBalanceBefore).to.gte(ethers.parseEther("0.4"));
    });

    it("all pause", async function () { 
        const {firstAccount, secondAccount} = await getNamedAccounts();
        await metaNodeStakeContract.connect(await ethers.getSigner(firstAccount)).pauseAll();
        // connect secondAccount and call unstake, but it should faild for pause

        await expect(metaNodeStakeContract.connect(await ethers.getSigner(secondAccount)).unstake(0, ethers.parseEther("0.1"))).to.be.revertedWithCustomError(metaNodeStakeContract, "EnforcedPause");
    });

    it("claimReward", async function () {
        const {firstAccount, secondAccount} = await getNamedAccounts();
        
        const metaNodeBalanceB = await metaNodeContract.balanceOf(secondAccount);
        console.log(`metaNodeBalanceB: ${metaNodeBalanceB}`);
        await metaNodeStakeContract.connect(await ethers.getSigner(firstAccount)).unpauseAll();
        await metaNodeStakeContract.connect(await ethers.getSigner(secondAccount)).claim(0);

        const metaNodeBalanceA = await metaNodeContract.balanceOf(firstAccount);
        console.log(`metaNodeBalanceA: ${metaNodeBalanceA}`);

     });
});