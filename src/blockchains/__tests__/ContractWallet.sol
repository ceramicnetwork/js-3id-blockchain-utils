contract ContractWallet {

    bool isValid = false;

    function isValidSignature(bytes memory _messageHash, bytes memory _signature) public view returns (bytes4 magicValue) {
        if (isValid) {
            return 0x20c13b0b;
        }
        return 0x0;
    }

    function setIsValid(bool valid) public {
        isValid = valid;
    }
}
