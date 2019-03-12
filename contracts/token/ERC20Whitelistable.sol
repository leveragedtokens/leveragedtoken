pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../whitelist/IWhitelist.sol";
import "./ERC20Burnable.sol";


// Disallow transfers of the token to or from blacklisted accounts.
contract ERC20Whitelistable is ERC20Mintable, ERC20Burnable, Ownable {
    event WhitelistChanged(IWhitelist indexed account);

    IWhitelist public whitelist;

    function setWhitelist(IWhitelist _whitelist) public onlyOwner {
        whitelist = _whitelist;
        emit WhitelistChanged(_whitelist);
    }

    modifier onlyWhitelisted(address account) {
        require(isWhitelisted(account));
        _;
    }

    modifier notWhitelisted(address account) {
        require(!isWhitelisted(account));
        _;
    }

    // Returns true if the account is allowed to send and receive tokens.
    function isWhitelisted(address account) public view returns (bool) {
        return whitelist.isWhitelisted(account);
    }

    function transfer(address to, uint256 value)
        public
        onlyWhitelisted(msg.sender)
        onlyWhitelisted(to)
        returns (bool)
    {
        return super.transfer(to, value);
    }

    function transferFrom(address from, address to, uint256 value)
        public
        onlyWhitelisted(from)
        onlyWhitelisted(to)
        returns (bool)
    {
        return super.transferFrom(from, to, value);
    }

    function mint(address to, uint256 value) public onlyWhitelisted(to) returns (bool) {
        return super.mint(to, value);
    }

    // Destroy the tokens held by a blacklisted account.
    function burnBlacklisted(address from, uint256 value)
        public
        onlyBurner()
        notWhitelisted(from)
    {
        _burn(from, value);
    }
}
