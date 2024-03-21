// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
* @title VerifyTypedData
* @dev a utility contract for CoinStir leveraging EIP712 to allow for proper signature and account verification logic.
*/

contract VerifyTypedData {

/**
* @notice txnSigner is for txn related logic only.
* @param recipiant is the destination address of the txn.
* @param value is the Ether amount of the txn.
* @param _signature is generated via EIP712 logic on the front end.
* @notice the recipiant and value params are used in the signature creation on the front end, and here are used to decipher the signers wallet address.
* @return users address.
* @dev by retrieving a signature on the front end and deconstructing it on chain, signatures can be used for a wallet address in the same way a password is used for a traditional account.
* When a user signs a txn they are creating a meta-txn which CoinStir enacts.
*/

    function txnSigner(address recipiant, string memory value, bytes memory _signature)
        public
        view
        returns (address)
    {
        // EIP721 domain type
        string memory name = "CoinStir";
        string memory version = "1";
        uint256 chainId = 23295;
        address verifyingContract = address(this); // Use address(0) or specify the actual contract address.

        // stringified types
        string memory EIP712_DOMAIN_TYPE = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
        string memory MESSAGE_TYPE = "Message(address recipiant,string value)";

        // hash to prevent signature collision
        bytes32 DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(abi.encodePacked(EIP712_DOMAIN_TYPE)),
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                chainId,
                verifyingContract
            )
        );

        // hash typed data
        bytes32 hash = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(
                    keccak256(bytes(MESSAGE_TYPE)),
                    recipiant,
                    keccak256(bytes(value))
                ))
            )
        );

        // split signature
        bytes32 r;
        bytes32 s;
        uint8 v;
        if (_signature.length != 65) {
            return address(0);
        }
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
        if (v < 27) {
            v += 27;
        }
        if (v != 27 && v != 28) {
            return address(0);
        } else {
            // verify
            return ecrecover(hash, v, r, s);
        }
    }


/**
* @notice getSigner is for 'sign-in' related logic only.
* @param note is the message presented to users on the front end when the signature request is made.
* @param _signature is generated via EIP712 logic on the front end upon signing of the previously mentioned note.
* @notice the note and _signature param are gathered in the front end, and here are used to decipher the signers wallet address.
* @return users address.
* @dev by retrieving a signature on the front end and deconstructing it on chain, signatures can be used for a wallet address in the same way a password is used for a traditional account.
* When a user signs a 'sign-in' message on the front end, they are providing CoinStir the necessary data to pull sensitive information for that specific users account. This is how the users txn history
* is able to be referenced. The only way for data of a specific account to be referenced by an account other than itself is via specific approval by CoinStir, reserved for regulatory and government agencies
* for compliance purposes.
*/

    function getSigner(string memory note, bytes memory _signature)
        public
        pure
        returns (address)
    {
        // EIP721 domain type
        string memory name = "CoinStir";
        string memory version = "1";
        uint256 chainId = 23295;
        address verifyingContract = address(0); // Use address(0) or specify the actual contract address.

        // stringified types
        string memory EIP712_DOMAIN_TYPE = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
        string memory MESSAGE_TYPE = "Message(string note)";

        // hash to prevent signature collision
        bytes32 DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(abi.encodePacked(EIP712_DOMAIN_TYPE)),
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                chainId,
                verifyingContract
            )
        );

        // hash typed data
        bytes32 hash = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(
                    keccak256(bytes(MESSAGE_TYPE)),
                    keccak256(bytes(note))
                ))
            )
        );

        // split signature
        bytes32 r;
        bytes32 s;
        uint8 v;
        if (_signature.length != 65) {
            return address(0);
        }
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
        if (v < 27) {
            v += 27;
        }
        if (v != 27 && v != 28) {
            return address(0);
        } else {
            // verify
            return ecrecover(hash, v, r, s);
        }
    }
}
