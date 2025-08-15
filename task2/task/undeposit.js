const {task} = require("hardhat/config");

task("undeposit", "UnDeposit 20.0 MyStakeToken")
  .setAction(async (taskArgs, hre) => {
    const {deployments, getNamedAccounts, ethers} = hre;
    const {firstAccount, secondAccount} = await getNamedAccounts();
    const metaNodeStake = await ethers.getContract("MetaNodeStake", secondAccount);
    const undepositTx = await metaNodeStake.unstake(1, ethers.parseEther("20.0"));
    console.log("undepositTx: ", undepositTx.hash);
    await undepositTx.wait(6);
    console.log(`undeposit has been confirmed`)
  });

  module.exports = {};