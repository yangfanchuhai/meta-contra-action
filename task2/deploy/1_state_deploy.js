const { AbiCoder } = require("ethers");
const fs = require('fs');
const path = require('path');
/**
 * deploy MetaNodeStake by deployProxy
 * @param {*} param0 
 */
module.exports = async ({getNamedAccounts, deployments, ethers, upgrades}) => {
    const metaNodeStakeFac = await ethers.getContractFactory("MetaNodeStake")
    const metaNodeTokenCon = await ethers.getContract("MetaNodeToken")

    const metaNodeTokenAddr = await metaNodeTokenCon.getAddress();
    console.log("metaNodeTokenAddr: ", metaNodeTokenAddr);
    const metaNodeStakeProxy = await upgrades.deployProxy(metaNodeStakeFac,
        [metaNodeTokenAddr, 1, 20000, ethers.parseEther("0.1")],
        {initializer: "initialize", kind: "uups"}
    );
    await metaNodeStakeProxy.waitForDeployment();

    const proxyAddress = await metaNodeStakeProxy.getAddress();
    const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("proxy contract:", proxyAddress);
    console.log("implementation:", implAddress);

    //must save or can't get the deploy by name
    const {save} = deployments;
    await save("MetaNodeStake", {
        abi: metaNodeStakeProxy.interface.format("json"),
        address: proxyAddress
    });

    const storePath = path.resolve(__dirname, "./.cache/MetaNodeStakeProxy.json");
    fs.writeFileSync(storePath, JSON.stringify({
        proxyAddress,
        implAddress,
        api: metaNodeStakeProxy.interface.format("json"),
    }));
};

module.exports.tags = ["all", "MetaNodeStake"];