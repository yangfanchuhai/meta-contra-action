const {deployments, getNamedAccounts} = require("hardhat")

module.exports = async({getNamedAccounts, deployments}) => {
    const {deploy, log} = deployments
    const {firstAccount} = await getNamedAccounts()
    log("Deploying MyMemeToken contract...")
    log("firstAccount:", firstAccount)
    await deploy("MyMemeToken", {
        from: firstAccount,
        args: [],
        log: true,
        contract: "MyMemeToken"
    })
    log("MyMemeToken contract deployed successfully")
}

module.exports.tags = ["all", "memetoken"]