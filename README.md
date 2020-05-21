# 3id-blockchain-utils
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![CircleCI](https://img.shields.io/circleci/project/github/3box/js-3id-blockchain-utils.svg?style=for-the-badge)](https://circleci.com/gh/3box/js-3id-blockchain-utils)
[![npm](https://img.shields.io/npm/dt/3id-blockchain-utils.svg?style=for-the-badge)](https://www.npmjs.com/package/3id-blockchain-utils)
[![npm](https://img.shields.io/npm/v/3id-blockchain-utils.svg?style=for-the-badge)](https://www.npmjs.com/package/3id-blockchain-utils)
[![Codecov](https://img.shields.io/codecov/c/github/3box/js-3id-blockchain-utils.svg?style=for-the-badge)](https://codecov.io/gh/3box/js-3id-blockchain-utils)
[![Greenkeeper badge](https://badges.greenkeeper.io/3box/js-3id-blockchain-utils.svg)](https://greenkeeper.io/)

This package contains a bunch of utilities that is used by 3ID and 3Box in order to create and verify links from blockchain addresses.

## Tabel of Contents
- [Install](#install)
- [Usage](#usage)
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
await authenticate.ethereum(message, '0x123abc...', ethereumProvider)
```

## Maintainers
[@oed](https://github.com/oed)

## Contributing
If you want to add support for a new blockchain to 3ID this is the place to do so. In order to do this start by adding a file for the given blockchain with the path: `src/blockchains/<blockchain-name>.js`. This module needs to export three functions; `typeDetector`, `createLink`, and `validateLink`. Please see `src/blockchains/ethereum.js` for an example.

You also need to add an `ADDRESS_TYPE` for the blockchain address scheme. Do this in the `src/constants.js` file.

Finally add support for your blockchain in `src/index.js`. Simply add it to the `handlers` array and the `typeDetectors` array.

### Test
Test the code by running:
```
$ npm test
```

## Licence
MIT © Joel Thorstensson
