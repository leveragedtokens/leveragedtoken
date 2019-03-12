const LeveragedToken = artifacts.require('LeveragedToken');
const Whitelist = artifacts.require('Whitelist');

module.exports = async function(deployer) {
  await deployer.deploy(LeveragedToken, 'TestLeveragedToken', 'TEST', 'BTC', 3);
  await deployer.deploy(Whitelist);

  let coin = await LeveragedToken.deployed();
  let whitelist = await Whitelist.deployed();
  await coin.setWhitelist(whitelist.address);
};
