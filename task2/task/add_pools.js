const {task} = require("hardhat/config");

task("add_pools", "Add ETH pool")
  .setAction(async (taskArgs, hre) => {
    const {getNamedAccounts, ethers} = hre;
    const {firstAccount} = await getNamedAccounts();
    const metaNodeStakeContract = await ethers.getContract("MetaNodeStake", firstAccount)
    console.log("metaNodeStakeContract: ", metaNodeStakeContract.target);
    await metaNodeStakeContract.addPool(ethers.ZeroAddress, 100, ethers.parseEther("0.01"), 200, true);
    await metaNodeStakeContract.addPool("0xCf649C22Fb7872e7b7be551f7a4f4685c5d2dAE6", 100, ethers.parseEther("50.0"), 100, true);
    const poolInfo = await metaNodeStakeContract.pool(1);
    console.log("poolInfo: ", poolInfo);
  })