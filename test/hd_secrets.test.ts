import { expect } from 'chai'
import { Wallet } from '@ethersproject/wallet'
import { HDSecretGenerator } from '../src/hd_secrets'


describe('poseidon.ts', function() {
  let hdSecrets: HDSecretGenerator

  beforeEach(() => {
    hdSecrets = new HDSecretGenerator({mnemonic: Wallet.createRandom().mnemonic.phrase})
  })

  it('Should have 10 nodes', () => {
    expect(hdSecrets.nodes.length).to.be.equal(10)
  })

  it('Should have 10 keys', () => {
    expect(hdSecrets.keyRing.length).to.be.equal(10)
  })

  it('Should have 10 commitments', () => {
    expect(hdSecrets.commitments.length).to.be.equal(10)
  })

  it('Should be fast: generate 1000 keys with default timeout', () => {
    hdSecrets = new HDSecretGenerator({mnemonic: Wallet.createRandom().mnemonic.phrase, numKeys: 1000})
    expect(hdSecrets.keyRing.length).to.be.equal(1000)
  })

})