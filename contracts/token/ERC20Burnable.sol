pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./BurnerRole.sol";


// Only allow accounts with the burner role to burn tokens.
contract ERC20Burnable is ERC20, BurnerRole {
    function burn(uint256 value) public onlyBurner() {
        _burn(msg.sender, value);
    }

    function burnFrom(address from, uint256 value) public onlyBurner() {
        _burnFrom(from, value);
    }
}
