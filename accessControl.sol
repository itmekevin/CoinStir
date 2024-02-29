//SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

contract accessControl {

    mapping(address => bool) public adminStatus;
    mapping(address => bool) public authStatus;
    mapping(address => bool) public relayerStatus;

// STIR RELAYER MODIFIER AND PERMS
    function flipRelayer(address _relayer) external onlyAdmin returns (bool) {
        relayerStatus[_relayer] = !relayerStatus[_relayer];
        return relayerStatus[_relayer];
    }

    modifier onlyRelayer() {
        require(relayerStatus[msg.sender] == true);
        _;
    }

// AUTH MODIFIER AND PERMS
    function flipAuth(address _auth) external onlyAdmin returns (bool) {
        authStatus[_auth] = !authStatus[_auth];
        return authStatus[_auth];
    }

    modifier onlyAuth() {
        require(authStatus[msg.sender] == true);
        _;
    }

// ADMIN/OWNER MODIFIER AND PERMS
    function flipAdmin(address _admin) external onlyAdmin returns (bool) {
        adminStatus[_admin] = !adminStatus[_admin];
        return adminStatus[_admin];
    }

    modifier onlyAdmin() {
        require(adminStatus[msg.sender] == true);
        _;
    }

}
