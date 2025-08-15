/**
 * Deploy MyStakeToken
 */
module.exports = async ({getNamedAccounts, deployments}) => { 
    const {secondAccount} = await getNamedAccounts();
    const {deploy, log} = deployments;
    log("Deploying MyStakeToken...");
    await deploy("MyStakeToken", {
        from: secondAccount,
        args: [],
        log: true,
    });
    log("MyStakeToken deployed successfully");
};

module.exports.tags = ["all", "my_sk_token"];