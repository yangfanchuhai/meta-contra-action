/**
 * Deploy MyStakeToken
 */
module.exports = async ({getNamedAccounts, deployments}) => { 
    const {firstAccount} = await getNamedAccounts();
    const {deploy, log} = deployments;
    log("Deploying MyStakeToken...");
    await deploy("MyStakeToken", {
        from: firstAccount,
        args: [],
        log: true,
    });
    log("MyStakeToken deployed successfully");
};

module.exports.tags = ["all", "my_sk_token"];