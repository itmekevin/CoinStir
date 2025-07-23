//SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

contract accessControl {

/**
* @dev maps 'relayerStatus' for a specific wallet to either true or false.
* @notice relayerStatus is a designation reserved for the CoinStir relayer(s) and ensures only the relayers can interact with certain functions.
* The relayers exist to prevent the need for users to purchase the $ROSE token that enables the privacy features, 
* as well as to further obfuscate a user from their specific interactions within CoinStir.
*/
    mapping(address => bool) public relayerStatus;

/**
* @dev maps 'adminStatus' for a specific wallet to either true or false.
* @notice adminStatus is the highest form of authority and grants full control over the contract.
*/
    mapping(address => bool) public adminStatus;

/**
* @dev maps 'authStatus' for a specific wallet to either true or false.
* @notice authStatus is to be granted only to regulatory or government agencies and allows for complete visiblity of all private data.
* This is explicitly to prevent money laundering.
*/
    mapping(address => bool) public authStatus;

/**
* @notice only an Admin can add a relayer.
* @dev adds a relayer. Relayers can only be added, and not removed, ensuring improvements are possible without removing access to a relayer altogether.
* @param _relayer is the address of the relayer to flip the current status of.
*/

    function flipRelayer(address _relayer) external onlyAdmin returns (bool) {
        relayerStatus[_relayer] = true;
        return relayerStatus[_relayer];
    }

/**
* @dev modifier to enforce the relayer logic described above.
*/

    modifier onlyRelayer() {
        require(relayerStatus[msg.sender] == true);
        _;
    }

/**
* @notice only an Admin can flip AdminStatus, providing strict controls and preventing abuse.
* @dev specifics of AdminStatus are detailed in above notes.
* @param _admin is the address of the admin to flip the current status of.
*/
    function flipAdmin(address _admin) external onlyAdmin returns (bool) {
        adminStatus[_admin] = !adminStatus[_admin];
        return adminStatus[_admin];
    }

/**
* @dev modifier to enforce the AdminStatus logic described above.
*/
    modifier onlyAdmin() {
        require(adminStatus[msg.sender] == true);
        _;
    }

/**
* @notice only an Admin can flip auth status, providing strict controls and preventing abuse.
* @dev specifics of authStatus are detailed in above notes. Care should be taken to ensure proper compliance with any relevant authority.
* @param _auth is the address of the authority to flip the current status of.
*/
    function flipAuth(address _auth) external onlyAdmin returns (bool) {
        authStatus[_auth] = !authStatus[_auth];
        return authStatus[_auth];
    }

}
