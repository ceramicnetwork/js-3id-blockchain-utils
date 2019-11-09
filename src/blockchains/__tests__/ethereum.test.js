import { ADDRESS_TYPES } from '../../constants'
import { encodeRpcCall } from '../../utils'
import { createLink, validateLink, typeDetector } from '../ethereum'
import ganache from 'ganache-core'
import sigUtils from 'eth-sig-util'

//jest.mock('../blockchains/ethereum', () => ({
  //typeDetector: jest.fn(),
  //createLink: jest.fn(),
  //validateLink: jest.fn(proof => proof),
//}))

const GANACHE_CONF = {
  seed: '0xd30553e27ba2954e3736dae1342f5495798d4f54012787172048582566938f6f'
}
const send = (provider, data) => new Promise((resolve, reject) => provider.send(data, (err, res) => {
  if (err) reject(err)
  else resolve(res.result)
}))

describe('Blockchain: Ethereum', () => {
  let provider, addresses
  let eoaProof

  const testDid = 'did:3:bafysdfwefwe'

  beforeAll(async () => {
    provider = ganache.provider(GANACHE_CONF)
    // ganache-core doesn't support personal_sign -.-
    provider.manager.personal_sign = (data, address, callback) => {
      const account = provider.manager.state.accounts[address.toLowerCase()]
      const result = sigUtils.personalSign(account.secretKey, { data })
      callback(null, result)
    }
    addresses = await send(provider, encodeRpcCall('eth_accounts'))
  })

  it('typeDetector: should return if not ethereum address', async () => {
    const notEthAddr = '0xabc123'
    expect(await typeDetector(notEthAddr, provider)).toBeFalsy()
  })

  it('typeDetector: should detect ethereumEOA address', async () => {
    expect(await typeDetector(addresses[0], provider)).toEqual(ADDRESS_TYPES.ethereumEOA)
  })

  it.skip('typeDetector: should detect erc1271 address', async () => {
    // TODO
    //expect(await typeDetector(addresses[0], provider)).toEqual(ADDRESS_TYPES.ethereumEOA)
  })

  it('createLink: should create ethereumEOA proof correctly', async () => {
    eoaProof = await createLink(testDid, addresses[0], ADDRESS_TYPES.ethereumEOA, provider, { skipTimestamp: true })
    expect(eoaProof).toMatchSnapshot()
  })

  it('createLink: should create erc1271 proof correctly', async () => {
    // In reality personal_sign is implemented differently by each contract wallet.
    // However the correct signature should still be returned. Here we simply test
    // that the proof is constructed correctly.
    expect(await createLink(testDid, addresses[0], ADDRESS_TYPES.erc1271, provider, { skipTimestamp: true })).toMatchSnapshot()
  })

  it('validateLink: invalid ethereumEOA proof should return null', async () => {
    // wrong address
    let invalidProof = Object.assign({}, eoaProof, { address: addresses[1] })
    expect(await validateLink(invalidProof)).toBeFalsy()
    // invalid signature
    invalidProof = Object.assign({}, eoaProof, { signature: '0xfa69ccf4a94db6132542abcabcabcab234b73f439700fbb748209890a5780f3365a5335f82d424d7f9a63ee41b637c116e64ef2f32c761bb065e4409f978c4babc' })
    expect(await validateLink(invalidProof)).toBeFalsy()
  })

  it('validateLink: valid ethereumEOA proof should return proof', async () => {
    expect(await validateLink(eoaProof)).toEqual(eoaProof)
  })

  it('validateLink: valid ethereumEOA proof (missing address) should return proof with address', async () => {
    let missingAddrProof = Object.assign({}, eoaProof)
    delete missingAddrProof.address
    expect(await validateLink(missingAddrProof)).toEqual(eoaProof)
  })

  it.skip('validateLink: invalid erc1271 proof should return null', async () => {
    // TODO
  })

  it.skip('validateLink: valid erc1271 proof should return proof', async () => {
    // TODO
  })
})
