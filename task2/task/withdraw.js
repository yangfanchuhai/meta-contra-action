const {task} = require("hardhat/config");

task("withdraw", "Withdraws the balance of the unstaked tokens")
  .setAction(async (taskArgs, hre) => {
    const {firstAccount, secondAccount} = await getNamedAccounts();

    const metaNodeStake = await ethers.getContract("MetaNodeStake", secondAccount);

    const {requestAmount, pendingWithdrawAmount} = await metaNodeStake.withdrawAmount(1, secondAccount);
    console.log(`requestAmount: ${requestAmount}`);
    console.log(`pendingWithdrawAmount: ${pendingWithdrawAmount}`);
    if (requestAmount == pendingWithdrawAmount) {
      console.log(`withdrawing ${requestAmount}`);
        //指定更高的gas 费用

        const withdrawTx = await metaNodeStake.withdraw(1, {gasPrice: 100000000});
        console.log("withdrawTx: ", withdrawTx.hash);
        await withdrawTx.wait(6);
        console.log(`withdraw has been confirmed`)
    } else {
        console.log(`You have to wait for the withdrawal to be unlocked`)
    }
  });

  module.exports = {
  };