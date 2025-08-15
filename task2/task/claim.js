const {task} = require("hardhat/config");

task("claim", "claim meta node token")
  .setAction(async (taskArgs, hre) => {
    const {firstAccount, secondAccount} = await getNamedAccounts();

    const metaNodeStake = await ethers.getContract("MetaNodeStake", secondAccount);

    const claimTx = await metaNodeStake.claim(1, {gasPrice: 100000000});
    console.log("claimTx: ", claimTx.hash);
    await claimTx.wait(6);
    console.log(`claim has been confirmed`)

    const metaNodeToken = await ethers.getContract("MetaNodeToken", secondAccount);
    console.log(`metaNodeToken balance: ${await metaNodeToken.balanceOf(secondAccount)}`);
  });

  module.exports = {
  };