pragma solidity ^0.5.0;


// Interface to be implemented by the Whitelist contract.
contract IWhitelist {
    function isWhitelisted(address account) public view returns (bool);
}
