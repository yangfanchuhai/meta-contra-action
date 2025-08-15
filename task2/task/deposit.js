const {task} = require("hardhat/config");

task("deposite", "Deposite")
  .setAction(async (taskArgs, hre) => {
    const {deployments, getNamedAccounts, ethers} = hre;
    
    const {firstAccount, secondAccount} = await getNamedAccounts();

    const myStakeToken = await ethers.getContract("MyStakeToken", secondAccount);

    const metaNodeStake = await hre.ethers.getContract("MetaNodeStake", secondAccount);

    const apprvTx = await myStakeToken.approve(metaNodeStake.target, ethers.parseEther("100.0"));
    console.log("apprvTx: ", apprvTx.hash);
    await apprvTx.wait(6);
    console.log(`approval has been confirmed`)
    const depositTx = await metaNodeStake.deposit(1, ethers.parseEther("100.0"));
    console.log("depositTx: ", depositTx.hash);
    await depositTx.wait(6);
    console.log(`deposit has been confirmed`)
    const myStakeTokenBalance = await metaNodeStake.stakingBalance(1, secondAccount);
    console.log(`myStakeTokenBalance: ${myStakeTokenBalance}`)
  })

  module.exports = {};