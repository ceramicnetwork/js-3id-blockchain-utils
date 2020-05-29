import { ADDRESS_TYPES } from './constants'
import ethereum from './blockchains/ethereum'

const findDID = did => did.match(/(did:(3|muport):[a-zA-Z0-9])\w+/)[0]

const handlers = {
  [ADDRESS_TYPES.ethereum]: ethereum,
  [ADDRESS_TYPES.ethereumEOA]: ethereum,
  [ADDRESS_TYPES.erc1271]: ethereum
}

const typeDetectors = [
  ethereum.typeDetector
]

async function detectType (address) {
  for (const detect of typeDetectors) {
    const type = await detect(address)
    if (type) return type
  }
}

async function createLink (did, address, provider, opts = {}) {
  const type = opts.type || await detectType(address)
  if (!handlers[type]) throw new Error(`creating link with type ${type}, not supported`)
  const produceProof = handlers[type].createLink
  const proof = await produceProof(did, address, type, provider, opts)
  if (proof) {
    return proof
  } else {
    throw new Error(`Unable to create proof with type ${type}`)
  }
}

async function validateLink (proof, did) {
  const validate = handlers[proof.type].validateLink
  if (typeof validate !== 'function') throw new Error(`proof with type ${proof.type} not supported`)
  const validProof = await validate(proof)
  if (validProof) {
    validProof.did = findDID(validProof.message)
    return validProof
  } else {
    return null
  }
}

async function authenticate (message, address, provider) {
  const type = await detectType(address)
  return handlers[type].authenticate(message, address, provider)
}

export {
  createLink,
  validateLink,
  authenticate
}
