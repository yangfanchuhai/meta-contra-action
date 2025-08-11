const {deployments, getNamedAccounts} = require("hardhat")

module.exports = async({getNamedAccounts, deployments}) => {
    const {deploy, log} = deployments
    const {firstAccount, secondAccount} = await getNamedAccounts()
    const myMemeToken = await deployments.get("MyMemeToken")
    log("MyMemeToken contract address:", myMemeToken.address)
    log("Deploying lp contract...")
    log("firstAccount:", firstAccount)
    await deploy("LiquidityPool", {
        from: firstAccount,
        args: [1, secondAccount, myMemeToken.address],
        log: true,
        contract: "LiquidityPool"
    })
    log("lp contract deployed successfully")
}

module.exports.tags = ["all", "lp"]