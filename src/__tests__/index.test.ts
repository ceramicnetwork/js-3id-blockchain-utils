import { ADDRESS_TYPES } from '../constants'
import { createLink, validateLink } from '../index'

jest.mock('../blockchains/ethereum', () => ({
  typeDetector: jest.fn(),
  createLink: jest.fn(),
  validateLink: jest.fn(proof => proof),
}))
import ethereum from '../blockchains/ethereum'


describe('3ID Blockchain Utils', () => {

  const testDid = 'did:3:bafysdfwefwe'
  const testAddr = '0x12345abcde'
  const mockProvider = 'fake provider'

  it('validateLink: should throw if type not supported', async () => {
    const proof = {
      type: 'not supported'
    }
    await expect(validateLink(proof)).rejects.toMatchSnapshot()
  })

  it('validateLink: ethereum types', async () => {
    const proof = {
      type: ADDRESS_TYPES.ethereumEOA,
      message: 'verifying did: ' + testDid
    }
    const proofWithDid = Object.assign(proof, { did: testDid })
    expect(await validateLink(proof)).toEqual(proofWithDid)
    expect(ethereum.validateLink).toHaveBeenCalledWith(proof)
    ethereum.validateLink.mockClear()
    proof.type = ADDRESS_TYPES.erc1271
    expect(await validateLink(proof)).toEqual(proofWithDid)
    expect(ethereum.validateLink).toHaveBeenCalledWith(proof)
  })


  it('createLink: should trow if type not supported', async () => {
    const type = 'typeABC'
    await expect(createLink(testDid, testAddr, mockProvider, { type })).rejects.toMatchSnapshot()
    await expect(createLink(testDid, testAddr, mockProvider)).rejects.toMatchSnapshot()
  })

  it('createLink: should create link with ethereum types correctly', async () => {
    const proof = { such: 'proof' }
    ethereum.createLink.mockImplementation(() => proof)
    ethereum.typeDetector.mockImplementationOnce(() => ADDRESS_TYPES.ethereumEOA)
    expect(await createLink(testDid, testAddr, mockProvider)).toEqual(proof)
    expect(ethereum.createLink).toHaveBeenCalledWith(testDid, testAddr, mockProvider, {})
    ethereum.createLink.mockClear()
    ethereum.typeDetector.mockImplementationOnce(() => ADDRESS_TYPES.erc1271)
    expect(await createLink(testDid, testAddr, mockProvider)).toEqual(proof)
    expect(ethereum.createLink).toHaveBeenCalledWith(testDid, testAddr, mockProvider, {})
  })
})
