# 3id-blockchain-utils
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![CircleCI](https://img.shields.io/circleci/project/github/ceramicnetwork/js-3id-blockchain-utils.svg?style=for-the-badge)](https://circleci.com/gh/ceramicnetwork/js-3id-blockchain-utils)
[![npm](https://img.shields.io/npm/dt/3id-blockchain-utils.svg?style=for-the-badge)](https://www.npmjs.com/package/3id-blockchain-utils)
[![npm](https://img.shields.io/npm/v/3id-blockchain-utils.svg?style=for-the-badge)](https://www.npmjs.com/package/3id-blockchain-utils)
[![Codecov](https://img.shields.io/codecov/c/github/ceramicnetwork/js-3id-blockchain-utils.svg?style=for-the-badge)](https://codecov.io/gh/ceramicnetwork/js-3id-blockchain-utils)

This package contains a bunch of utilities that is used by 3ID and 3Box in order to create and verify links from blockchain addresses.

## Tabel of Contents
- [Install](#install)
- [Usage](#usage)
- [Supported blockchains](#supported-blockchains)
- [Contributing](#contributing)
  - [Test](#Test)
- [License](#license)

## Install
```
$ npm install --save 3id-blockchain-utils
```

## Usage
Import the package into your project
```js
import { createLink, validateLink, authenticate } from '3id-blockchain-utils'
```

Use the library to create and verify links:
```js
const did = 'did:3:bafypwg9834gf...'
const proof = await createLink(did, '0x123abc...', ethereumProvider)
console.log(proof)

const verified = await validateLink(proof)
if (verified) {
  console.log('Proof is valid', proof)
} else {
  console.log('Proof is invalid')
}
```

Use the library for 3ID authenticate:

```js
await authenticate(message, '0x123abc...', ethereumProvider)
```

## Supported blockchains

Below you can see a table which lists supported blockchains and their provider objects.

| Blockchain | CAIP-2 namespace | Supported providers             |
|------------|-----------|---------------------------------|
| Ethereum   | [eip155](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-3.md)    | metamask-like ethereum provider |

## Maintainers
[@oed](https://github.com/oed)

## Adding support for a blockchain
If you want to add support for a new blockchain to 3ID this is the place to do so. This library uses [CAIP-10](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md) to represent accounts in a blockchain agnostic way. If the blockchain you want to add isn't already part of the [CAIP](https://github.com/ChainAgnostic/CAIPs) standards you shold make sure to add it there.

To begin adding support for a given blockchain add a file with the path: `src/blockchains/<blockchain-name>.js`. This module needs to export three functions:

* `createLink` - creates a LinkProof object which associates the specified AccountID with the DID
* `validateLink` - validates the given LinkProof
* `authenticate` - signs a message and returns some entropy based on the signature. Needs to be deterministic

It also needs to export a constant called `namespace`. This constant is a string which contains the [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md) chainId namespace.

Please see `src/blockchains/ethereum.js` for an example of how this is implemented for the `eip155` (ethereum) CAIP-2 namespace.


Finally add support for your blockchain in `src/index.js`. Simply add it to the `handlers` array.

### Test
Test the code by running:
```
$ npm test
```

## Licence
Apache-2.0 OR MIT
