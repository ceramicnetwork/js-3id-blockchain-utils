import { AccountID } from 'caip'
import { createLink, validateLink, authenticate } from '../index'

jest.mock('../blockchains/ethereum', () => ({
  createLink: jest.fn(),
  validateLink: jest.fn(proof => proof),
  authenticate: jest.fn(),
  namespace: 'eip155'
}))
import ethereum from '../blockchains/ethereum'


describe('3ID Blockchain Utils', () => {

  const testDid = 'did:3:bafysdfwefwe'
  const testAccount = new AccountID('0x12345abcde@eip155:1337')
  const notSupportedAccount = new AccountID('0x12345abcde@not-supported:1337')
  const mockProvider = 'fake provider'

  it('validateLink: should throw if namespace not supported', async () => {
    const proof = {
      version: 2,
      account: notSupportedAccount
    }
    await expect(validateLink(proof)).rejects.toMatchSnapshot()
  })

  it('validateLink: ethereum namespace', async () => {
    const proof = {
      version: 2,
      message: 'verifying did: ' + testDid,
      account: testAccount
    }
    const proofWithDid = Object.assign(proof, { did: testDid })
    expect(await validateLink(proof)).toEqual(proofWithDid)
    expect(ethereum.validateLink).toHaveBeenCalledWith(proof)
    ethereum.validateLink.mockClear()
    // version < 2 should be interpreted as ethereum
    delete proof.version
    expect(await validateLink(proof)).toEqual(proofWithDid)
    expect(ethereum.validateLink).toHaveBeenCalledWith(proof)
  })

  it('createLink: should throw if namespace not supported', async () => {
    await expect(createLink(testDid, notSupportedAccount, mockProvider)).rejects.toMatchSnapshot()
  })

  it('createLink: should create link with ethereum namespace correctly', async () => {
    const proof = {
      version: 2,
      message: 'verifying did: ' + testDid,
      account: testAccount
    }
    ethereum.createLink.mockImplementation(() => proof)
    expect(await createLink(testDid, testAccount, mockProvider)).toEqual(proof)
    expect(ethereum.createLink).toHaveBeenCalledWith(testDid, testAccount, mockProvider, {})
  })

  it('authenticate: should throw if namespace not supported', async () => {
    await expect(authenticate('msg', notSupportedAccount, mockProvider)).rejects.toMatchSnapshot()
  })

  it('authenticate: should create link with ethereum namespace correctly', async () => {
    ethereum.authenticate.mockImplementation(() => 'entropy')
    expect(await authenticate('msg', testAccount, mockProvider)).toEqual('entropy')
    expect(ethereum.authenticate).toHaveBeenCalledWith('msg', testAccount, mockProvider)
  })
})
