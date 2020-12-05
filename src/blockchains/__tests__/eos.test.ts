import {EOSIOProvider} from "@smontero/eosio-local-provider";
import {authenticate, createLink, validateLink} from "../eos";
import {AccountID} from "caip";

jest.setTimeout(15000)

const did = 'did:3:bafysdfwefwe'
const telosTestnetChainId = '1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f'
const jungleChainId = '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840'
const telosTestnetCAIPChainId = '1eaa0824707c8c16bd25145493bf062a'
const jungleCAIPChainId = '2a02a0053e5a8cf73a56ba0fda11e4d9'
const invalidCAIPChainId = '11111111111111111111111111111111'
const telosTestnetAccount = 'testuser1111'
const jungleAccount = 'idx3idctest1'
const telosTestnetProvider = new EOSIOProvider({
    chainId: telosTestnetChainId,
    account: telosTestnetAccount,
    keys: {
      EOS6uUc8fYoCdyz7TUAXqHvRbU7QnVirFuvcAW6NMQqBabdME6FnL: '5KFFFvKioakMpt8zWnyGKnLaDzzUSqy5V33PHHoxEam47pLJmo2'
    }
  })
  const jungleProvider = new EOSIOProvider({
    chainId: jungleChainId,
    account: jungleAccount,
    keys: {
        EOS7f7hdusWKXY1cymDLvUL3m6rTLKmdyPi4e6kquSnmfVxxEwVcC: '5JRzDcbMqvTJxjHeP8vZqZbU9PwvaaTsoQhoVTAs3xBVSZaPB9U'
    }
  })

describe('createLink', () => {
    test('generate proof on telos testnet', async () => {
        const account = new AccountID(`${telosTestnetAccount}@eosio:${telosTestnetCAIPChainId}`)
        const proof = await createLink(did, account, telosTestnetProvider, {skipTimestamp: true})
        expect(proof).toMatchSnapshot()
    })

    // test('generate proof on telos testnet with timestamp', async () => {
    //     const account = new AccountID(`${telosTestnetAccount}@eosio:${telosTestnetCAIPChainId}`)
    //     const proof = await createLink(did, account, telosTestnetProvider, {skipTimestamp: false})
    //     expect(proof).toMatchSnapshot()
    // })

    test('generate proof on jungle testnet', async () => {
        const account = new AccountID(`${jungleAccount}@eosio:${jungleCAIPChainId}`)
        const proof = await createLink(did, account, jungleProvider, {skipTimestamp: true})
        expect(proof).toMatchSnapshot()
    })

    test('fail on telos testnet account for jungle provider', async () => {
        const account = new AccountID(`${telosTestnetAccount}@eosio:${telosTestnetCAIPChainId}`)
        await expect(createLink(did, account, jungleProvider, {skipTimestamp: true})).rejects.toThrow()
    })

    test('fail on telos testnet account for jungle chain', async () => {
        const account = new AccountID(`${telosTestnetAccount}@eosio:${jungleCAIPChainId}`)
        await expect(createLink(did, account, jungleProvider, {skipTimestamp: true})).rejects.toThrow()
    })

    test('fail on jungle account for telos testnet provider', async () => {
        const account = new AccountID(`${jungleAccount}@eosio:${jungleCAIPChainId}`)
        await expect(createLink(did, account, telosTestnetProvider, {skipTimestamp: true})).rejects.toThrow()
    })

    test('fail on jungle account for telos testnet chain', async () => {
        const account = new AccountID(`${jungleAccount}@eosio:${telosTestnetCAIPChainId}`)
        await expect(createLink(did, account, telosTestnetProvider, {skipTimestamp: true})).rejects.toThrow()
    })
    
})

describe('validateLink', () => {
    test('Telos testnet', async () => {
        const account = new AccountID(`${telosTestnetAccount}@eosio:${telosTestnetCAIPChainId}`)
        const proof = await createLink(did, account, telosTestnetProvider, {skipTimestamp: true})
        await expect(validateLink(proof)).resolves.toEqual(proof)

        let testAccount = new AccountID(`${jungleAccount}@eosio:${jungleCAIPChainId}`)
        proof.account = testAccount.toString()
        await expect(validateLink(proof)).resolves.toEqual(null)

        testAccount = new AccountID(`${jungleAccount}@eosio:${telosTestnetCAIPChainId}`)
        proof.account = testAccount.toString()
        await expect(validateLink(proof)).resolves.toEqual(null)

        testAccount = new AccountID(`${jungleAccount}@eosio:${invalidCAIPChainId}`)
        proof.account = testAccount.toString()
        await expect(validateLink(proof)).resolves.toEqual(null)
    })

    test('Jungle', async () => {
        const account = new AccountID(`${jungleAccount}@eosio:${jungleCAIPChainId}`)
        const proof = await createLink(did, account, jungleProvider, {skipTimestamp: true})
        await expect(validateLink(proof)).resolves.toEqual(proof)

        let testAccount = new AccountID(`${telosTestnetAccount}@eosio:${telosTestnetCAIPChainId}`)
        proof.account = testAccount.toString()
        await expect(validateLink(proof)).resolves.toEqual(null)

        testAccount = new AccountID(`${telosTestnetAccount}@eosio:${jungleCAIPChainId}`)
        proof.account = testAccount.toString()
        await expect(validateLink(proof)).resolves.toEqual(null)

        testAccount = new AccountID(`${telosTestnetAccount}@eosio:${invalidCAIPChainId}`)
        proof.account = testAccount.toString()
        await expect(validateLink(proof)).resolves.toEqual(null)

    })
})

describe('authenticate', () => {
    test('Telos Testnet', async () => {
        const account = new AccountID(`${telosTestnetAccount}@eosio:${telosTestnetCAIPChainId}`)
        expect(await authenticate('msg', account, telosTestnetProvider)).toMatchSnapshot()
    })

    test('Jungle', async () => {
        const account = new AccountID(`${jungleAccount}@eosio:${jungleCAIPChainId}`)
        expect(await authenticate('msg', account, jungleProvider)).toMatchSnapshot()
    })
})
