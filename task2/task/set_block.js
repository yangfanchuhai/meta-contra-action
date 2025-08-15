const {task} = require("hardhat/config");

task("set-block", "Set block number")
  .addParam("startblock", "Start Block number")
  .addParam("endblock", "End Block number")
  .setAction(async (taskArgs, hre) => {
    const {startblock, endblock} = taskArgs;
    const {getNamedAccounts, ethers} = hre;
    const {firstAccount} = await getNamedAccounts();
    const metaNodeStake = await ethers.getContract("MetaNodeStake", firstAccount);
    console.log(await metaNodeStake.startBlock(), await metaNodeStake.endBlock())
    await metaNodeStake.setEndBlock(endblock);
    //wait some blocks
    await metaNodeStake.setStartBlock(startblock);
    console.log(`Set block number successfully`);
  });

module.exports = {};