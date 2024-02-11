// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract VerifyTypedData {

    function txnSigner(address recipiant, string memory value, bytes memory _signature)
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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// \\ // \\// \\ // \\// \\ // \\// \\ // \\// \\ // \\// \\ // \\// \\ // \\// \\ // \\// \\ // \\// \\ // \\// \\ // \\// \\ // \\// \\ // \\// \\ ///
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
