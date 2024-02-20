//SPDX-License-Identifier: MIT

pragma solidity 0.8.22;

/**
* @title accessControl
* @dev a utility contract for CoinStir setting various permissions and controls.
*/
contract accessControl {

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
* @dev maps 'relayerStatus' for a specific wallet to either true or false.
* @notice relayerStatus is a designation reserved for the CoinStir relayer(s) and ensures only the relayers can interact with certain functions.
* The relayers exist to prevent the need for users to purchase the $ROSE token that enables the privacy features, 
* as well as to further obfuscate a user from their specific interactions within CoinStir.
*/
    mapping(address => bool) public relayerStatus;

/**
* @notice only an Admin can grant relayer status, providing strict controls and preventing abuse.
* @dev specifics of relayer are detailed in above notes. Care should be taken when granting relayerStatus to ensure the address is functional, keys are protected, and relayer is properly funded.
* @param accepts any address.
*/
    function grantRelayer(address _relayer) public onlyAdmin {
        relayerStatus[_relayer] = true;
    }

/**
* @notice only an Admin can revoke relayer status, providing strict controls and preventing abuse.
* @dev revokes relayer status. Care should be taken to ensure constant up-time of at least one relayer.
* @param accepts any address.
*/
    function revokeRelayer(address _relayer) public onlyAdmin {
        relayerStatus[_relayer] = false;
    }

/**
* @dev modifier to enforce the relayer logic described above.
*/
    modifier onlyRelayer() {
        require(relayerStatus[msg.sender] == true);
        _;
    }


/**
* @notice only an Admin can grant auth status, providing strict controls and preventing abuse.
* @dev specifics of authStatus are detailed in above notes. Care should be taken when granting authStatus to ensure the address is indeed under the sole control of a relevant authority.
* @param accepts any address.
*/
    function grantAuth(address auth) public onlyAdmin {
        authStatus[auth] = true;
    }

/**
* @notice only an Admin can revoke auth status, providing strict controls and preventing abuse.
* @dev specifics of authStatus are detailed in above notes. Care should be taken to ensure proper compliance with any relevant authority.
* @param accepts any address.
*/
    function revokeAuth(address auth) public onlyAdmin {
        authStatus[auth] = false;
    }

/**
* @dev modifier to enforce the authStatus logic described above.
*/
    modifier onlyAuth() {
        require(authStatus[msg.sender] == true);
        _;
    }

/**
* @notice only an Admin can grant Admin status, providing strict controls and preventing abuse.
* @dev specifics of AdminStatus are detailed in above notes. Care should be taken when granting AdminStatus to ensure the address is indeed under the sole control of the intended recipiant.
* @param accepts any address.
*/
    function grantAdmin(address admin) public onlyAdmin {
        adminStatus[admin] = true;
    }

/**
* @notice only an Admin can revoke AdminStatus, providing strict controls and preventing abuse.
* @dev specifics of AdminStatus are detailed in above notes. Care should be taken to ensure one account maintains adminStatus at all times.
* @param accepts any address.
*/
    function revokeAdmin(address admin) public onlyAdmin {
        adminStatus[admin] = false;
    }

/**
* @dev modifier to enforce the AdminStatus logic described above.
*/
    modifier onlyAdmin() {
        require(adminStatus[msg.sender] == true);
        _;
    }

}
