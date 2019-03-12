pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/access/roles/WhitelistedRole.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./IWhitelist.sol";


contract Whitelist is IWhitelist, WhitelistedRole, Ownable {
    function addWhitelistAdmin(address account) public onlyOwner {
        _addWhitelistAdmin(account);
    }

    function removeWhitelistAdmin(address account) public onlyOwner {
        _removeWhitelistAdmin(account);
    }

    function batchAddWhitelisted(address[] calldata accounts) external onlyWhitelistAdmin {
        for (uint i = 0; i < accounts.length; ++i) {
            _addWhitelisted(accounts[i]);
        }
    }
}
