//SPDX-License-Identifier: MIT

pragma solidity 0.8.22;

contract accessControl {

    mapping(address => bool) public adminStatus;
    mapping(address => bool) public authStatus;
    mapping(address => bool) public relayerStatus;

// STIR RELAYER MODIFIER AND PERMS
    function grantRelayer(address _relayer) public onlyAdmin {
        relayerStatus[_relayer] = true;
    }

    function revokeRelayer(address _relayer) public onlyAdmin {
        relayerStatus[_relayer] = false;
    }

    modifier onlyRelayer() {
        require(relayerStatus[msg.sender] == true);
        _;
    }

// AUTH MODIFIER AND PERMS
    function grantAuth(address auth) public onlyAdmin {
        authStatus[auth] = true;
    }

    function revokeAuth(address auth) public onlyAdmin {
        authStatus[auth] = false;
    }

    modifier onlyAuth() {
        require(authStatus[msg.sender] == true);
        _;
    }

// ADMIN/OWNER MODIFIER AND PERMS
    function grantAdmin(address admin) public onlyAdmin {
        adminStatus[admin] = true;
    }

    function revokeAdmin(address admin) public onlyAdmin {
        adminStatus[admin] = false;
    }

    modifier onlyAdmin() {
        require(adminStatus[msg.sender] == true);
        _;
    }

}
