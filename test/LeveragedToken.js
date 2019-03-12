const LeveragedToken = artifacts.require('LeveragedToken');
const Whitelist = artifacts.require('Whitelist');

contract('LeveragedToken', async accounts => {
  let [owner, minter, burner, regularUser, regularUser2] = accounts;
  let coin, whitelist;
  beforeEach('deploy contract', async () => {
    [coin, whitelist] = await Promise.all([
      LeveragedToken.new('TestLeveragedToken', 'TEST', 'BTC', 3),
      Whitelist.new(),
    ]);
    await Promise.all([
      whitelist.batchAddWhitelisted(accounts),
      coin.setWhitelist(whitelist.address),
      coin.addMinter(minter, { from: owner }),
      coin.addBurner(burner, { from: owner }),
    ]);
  });

  async function getBalance(account) {
    let result = await coin.balanceOf(account);
    return result.toNumber();
  }

  it('should be mintable', async () => {
    assert.equal(await getBalance(minter), 0);
    assert.equal(await getBalance(regularUser), 0);

    await coin.mint(regularUser, 123, { from: minter });

    assert.equal(await getBalance(minter), 0);
    assert.equal(await getBalance(regularUser), 123);
  });

  it('should not allow regular users to mint', async () => {
    assert.equal(await getBalance(minter), 0);
    assert.equal(await getBalance(regularUser), 0);

    await assertRevert(coin.mint(regularUser, 123, { from: regularUser }));

    assert.equal(await getBalance(regularUser), 0);
    assert.equal(await getBalance(minter), 0);
  });

  it('should allow additional minters', async () => {
    // Regular user is not a minter and cannot add additional minters.
    await assertRevert(coin.mint(regularUser, 123, { from: regularUser }));
    await assertRevert(coin.addMinter(regularUser, { from: regularUser }));
    await assertRevert(coin.addMinter(regularUser2, { from: regularUser }));

    await coin.addMinter(regularUser, { from: minter });
    coin.mint(regularUser, 123, { from: regularUser });
    assert.equal(await getBalance(regularUser), 123);

    // Make sure original minter can still mint.
    coin.mint(regularUser, 321, { from: minter });
    assert.equal(await getBalance(regularUser), 444);
  });

  it('should be transferable', async () => {
    await coin.mint(regularUser, 5, { from: minter });
    assert.equal(await getBalance(regularUser), 5);
    assert.equal(await getBalance(regularUser2), 0);

    await coin.transfer(regularUser2, 3, { from: regularUser });
    assert.equal(await getBalance(regularUser), 2);
    assert.equal(await getBalance(regularUser2), 3);
  });

  it('should allow changing whitelist', async () => {
    await coin.mint(regularUser, 5, { from: minter });
    assert.equal(await getBalance(regularUser), 5);

    let oldWhitelist = whitelist;
    let newWhitelist = await Whitelist.new();
    await coin.setWhitelist(newWhitelist.address);

    await assertRevert(coin.mint(regularUser, 10, { from: minter }));
    assert.equal(await getBalance(regularUser), 5);

    await coin.setWhitelist(oldWhitelist.address);
    await coin.mint(regularUser, 20, { from: minter });
    assert.equal(await getBalance(regularUser), 25);
  });

  it('should not allow minting to non-whitelisted accounts', async () => {
    await coin.mint(regularUser, 5, { from: minter });
    assert.equal(await getBalance(regularUser), 5);

    await whitelist.removeWhitelisted(regularUser);

    await assertRevert(coin.mint(regularUser, 10, { from: minter }));
    assert.equal(await getBalance(regularUser), 5);
  });

  it('should not allow transfers to non-whitelisted accounts', async () => {
    await coin.mint(regularUser, 100, { from: minter });
    await coin.transfer(regularUser2, 10, { from: regularUser });
    assert.equal(await getBalance(regularUser), 90);
    assert.equal(await getBalance(regularUser2), 10);

    await whitelist.removeWhitelisted(regularUser2);

    await assertRevert(coin.transfer(regularUser2, 10, { from: regularUser }));
    assert.equal(await getBalance(regularUser), 90);
    assert.equal(await getBalance(regularUser2), 10);
  });

  it('should not allow transfers to non-whitelisted accounts via transferFrom', async () => {
    await coin.mint(regularUser, 100, { from: minter });
    await coin.approve(regularUser2, 100, { from: regularUser });
    await coin.transferFrom(regularUser, regularUser2, 10, { from: regularUser2 });
    assert.equal(await getBalance(regularUser), 90);
    assert.equal(await getBalance(regularUser2), 10);

    await whitelist.removeWhitelisted(regularUser2);

    await assertRevert(coin.transferFrom(regularUser, regularUser2, 10, { from: regularUser2 }));
    assert.equal(await getBalance(regularUser), 90);
    assert.equal(await getBalance(regularUser2), 10);
  });

  it('should not allow transfers from non-whitelisted accounts', async () => {
    await coin.mint(regularUser, 100, { from: minter });
    await coin.transfer(regularUser2, 10, { from: regularUser });
    assert.equal(await getBalance(regularUser), 90);
    assert.equal(await getBalance(regularUser2), 10);

    await whitelist.removeWhitelisted(regularUser);

    await assertRevert(coin.transfer(regularUser2, 10, { from: regularUser }));
    assert.equal(await getBalance(regularUser), 90);
    assert.equal(await getBalance(regularUser2), 10);
  });

  it('should not allow transfers from non-whitelisted accounts via transferFrom', async () => {
    await coin.mint(regularUser, 100, { from: minter });
    await coin.approve(regularUser2, 100, { from: regularUser });
    await coin.transferFrom(regularUser, regularUser2, 10, { from: regularUser2 });
    assert.equal(await getBalance(regularUser), 90);
    assert.equal(await getBalance(regularUser2), 10);

    await whitelist.removeWhitelisted(regularUser);

    await assertRevert(coin.transferFrom(regularUser, regularUser2, 10, { from: regularUser2 }));
    assert.equal(await getBalance(regularUser), 90);
    assert.equal(await getBalance(regularUser2), 10);
  });

  it('should allow burner to burn tokens', async () => {
    await coin.mint(regularUser, 100, { from: minter });
    assert.equal(await getBalance(regularUser), 100);

    await coin.approve(burner, 15, { from: regularUser });
    await coin.burnFrom(regularUser, 10, { from: burner });
    assert.equal(await getBalance(regularUser), 90);

    await coin.addBurner(regularUser, { from: burner });
    await coin.burn(60, { from: regularUser });
    assert.equal(await getBalance(regularUser), 30);
  });

  it('should not allow regular users to burn tokens', async () => {
    await coin.mint(regularUser, 100, { from: minter });
    assert.equal(await getBalance(regularUser), 100);

    await assertRevert(coin.burn(60, { from: regularUser }));
    assert.equal(await getBalance(regularUser), 100);

    await coin.approve(regularUser2, 15, { from: regularUser });
    await assertRevert(coin.burnFrom(regularUser, 10, { from: regularUser2 }));
    assert.equal(await getBalance(regularUser), 100);
  });

  it('should not allow burners to burn arbituary tokens', async () => {
    await coin.mint(regularUser, 100, { from: minter });
    assert.equal(await getBalance(regularUser), 100);

    await assertRevert(coin.burnFrom(regularUser, 10, { from: burner }));
    assert.equal(await getBalance(regularUser), 100);

    await assertRevert(coin.burnBlacklisted(regularUser, 10, { from: burner }));
    assert.equal(await getBalance(regularUser), 100);
  });

  it('should allow burners to burn blacklisted balances', async () => {
    await coin.mint(regularUser, 100, { from: minter });
    assert.equal(await getBalance(regularUser), 100);

    await whitelist.removeWhitelisted(regularUser);

    await coin.burnBlacklisted(regularUser, 10, { from: burner });
    assert.equal(await getBalance(regularUser), 90);
  });

  it('should not allow regular users to burn blacklisted balances', async () => {
    await coin.mint(regularUser, 100, { from: minter });
    assert.equal(await getBalance(regularUser), 100);

    await whitelist.removeWhitelisted(regularUser);

    await assertRevert(coin.burnBlacklisted(regularUser, 10, { from: regularUser }));
    await assertRevert(coin.burnBlacklisted(regularUser, 10, { from: regularUser2 }));
    assert.equal(await getBalance(regularUser), 100);
  });

  it('should allow owner to reclaim tokens', async () => {
    await coin.mint(regularUser, 100, { from: minter });
    assert.equal(await getBalance(regularUser), 100);
    assert.equal(await getBalance(coin.address), 0);
    assert.equal(await getBalance(owner), 0);

    await whitelist.addWhitelisted(coin.address);
    await coin.transfer(coin.address, 10, { from: regularUser });
    assert.equal(await getBalance(regularUser), 90);
    assert.equal(await getBalance(coin.address), 10);
    assert.equal(await getBalance(owner), 0);

    await coin.reclaimToken(coin.address, { from: owner });
    assert.equal(await getBalance(regularUser), 90);
    assert.equal(await getBalance(coin.address), 0);
    assert.equal(await getBalance(owner), 10);
  });

  it('should only allow owner to reclaim tokens', async () => {
    await coin.mint(regularUser, 100, { from: minter });
    assert.equal(await getBalance(coin.address), 0);
    assert.equal(await getBalance(owner), 0);
    assert.equal(await getBalance(regularUser), 100);
    assert.equal(await getBalance(regularUser2), 0);

    await whitelist.addWhitelisted(coin.address);
    await coin.transfer(coin.address, 10, { from: regularUser });
    assert.equal(await getBalance(coin.address), 10);
    assert.equal(await getBalance(owner), 0);
    assert.equal(await getBalance(regularUser), 90);
    assert.equal(await getBalance(regularUser2), 0);

    await assertRevert(coin.reclaimToken(coin.address, { from: regularUser2 }));
    assert.equal(await getBalance(coin.address), 10);
    assert.equal(await getBalance(owner), 0);
    assert.equal(await getBalance(regularUser), 90);
    assert.equal(await getBalance(regularUser2), 0);

    await coin.transferOwnership(regularUser2, { from: owner });
    await coin.reclaimToken(coin.address, { from: regularUser2 });
    assert.equal(await getBalance(coin.address), 0);
    assert.equal(await getBalance(owner), 0);
    assert.equal(await getBalance(regularUser), 90);
    assert.equal(await getBalance(regularUser2), 10);
  });
});

async function assertRevert(promise) {
  try {
    await promise;
    throw null;
  } catch (error) {
    assert(error, 'did not revert');
    assert(
      error.message.startsWith('Returned error: VM Exception while processing transaction: revert'),
    );
  }
}
