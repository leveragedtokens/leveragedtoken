pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol';
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "./ERC20Whitelistable.sol";
import "./ERC20Burnable.sol";
import "../utils/CanReclaimEther.sol";
import "../utils/CanReclaimToken.sol";


contract LeveragedToken is
    ERC20Detailed,
    ERC20Pausable,
    ERC20Mintable,
    ERC20Burnable,
    ERC20Whitelistable,
    CanReclaimEther,
    CanReclaimToken
{
    string public underlying;
    int8 public leverage;

    constructor(string memory name, string memory symbol, string memory _underlying, int8 _leverage)
        ERC20Detailed(name, symbol, 18)
        public
    {
        underlying = _underlying;
        leverage = _leverage;
    }
}
