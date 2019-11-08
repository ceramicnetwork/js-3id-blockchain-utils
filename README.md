# 3id-blockchain-utils
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

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
import { createLink, validateLink } from '3id-blockchain-utils'
```

Use the library to create and verify links:
```js
const proof = createLink('0x123abc...', ethereumProvider)
console.log(proof)

const verified = validateLink(proof)
if (verified) {
  console.log('Proof is valid', proof)
} else {
  console.log('Proof is invalid')
}
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
