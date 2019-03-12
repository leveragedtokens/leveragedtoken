pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


// Ether should not be sent to this contract. If any ether is accidentally sent to this
// contract, allow the contract owner to recover it.
// Copied from https://github.com/OpenZeppelin/openzeppelin-solidity/blob/2441fd7d17bffa1944f6f539b2cddd6d19997a31/contracts/ownership/HasNoEther.sol
contract CanReclaimEther is Ownable {
    function reclaimEther() external onlyOwner {
        msg.sender.transfer(address(this).balance);
    }
}
