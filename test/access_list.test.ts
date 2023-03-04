import { expect } from 'chai'
import { BigNumber } from '@ethersproject/bignumber'
import { ALLOWED, BLOCKED } from '../src/common'
import { AccessList } from '../src/access_list'
import { poseidon } from '../src/poseidon'
import {
  subsetDataToBytes,
  packSubsetData,
  BytesData,
  PackedData,
  SubsetData,
} from '../src/subsets'

var N = Math.floor(Math.random() * 200) + 50
var randomSplitIndex = Math.floor(Math.random() * N)

describe('access_list.ts', function() {
  let allowlistZeros: BigNumber[]
  let blocklistZeros: BigNumber[]
  let packedData: PackedData
  let bytesData: BytesData
  let subsetData: SubsetData

  before(() => {
    console.log(`Random subsetData length for this test: ${N}`)
    console.log(`Random split index for this test: ${randomSplitIndex}`)

    allowlistZeros = [BLOCKED]
    for (let i = 0; i < 20; i++) {
      allowlistZeros[i+1] = poseidon([allowlistZeros[i], allowlistZeros[i]], 1) as BigNumber
    }
    blocklistZeros = [ALLOWED]
    for (let i = 0; i < 20; i++) {
      blocklistZeros[i+1] = poseidon([blocklistZeros[i], blocklistZeros[i]], 1) as BigNumber
    }

    subsetData = new Array(N)
    for (let i = 0; i < subsetData.length; i++) {
      subsetData[i] = Math.floor(Math.random() * 2) as (0 | 1)
    }
    packedData = packSubsetData(subsetData)
    bytesData = subsetDataToBytes(subsetData)
  })

  it('should instantiate a valid empty list of random length < 10,000', () => {
    const subsetLength = Math.ceil(Math.random() * 10000)
    const accessList = AccessList.fullEmpty({ subsetLength, accessType: 'allowlist' })
    expect(accessList.length).to.be.equal(subsetLength)
    expect(accessList.root).to.be.deep.equal(accessList.zeroValues[accessList.LEVELS])
  }).timeout(30000)

  it('should have matching accesslists for all three constructor methods (allowlist)', () => {
    const fromSubset = new AccessList({ accessType: 'allowlist', subsetData })
    const fromBytes = new AccessList({ accessType: 'allowlist', bytesData })
    const fromPacked = new AccessList({ accessType: 'allowlist', packedData })
    expect(fromSubset).to.be.deep.equal(fromBytes)
    expect(fromPacked).to.be.deep.equal(fromBytes)
  }).timeout(N * 200)

  it('should have matching accesslists for all three constructor methods (blocklist)', () => {
    const fromSubset = new AccessList({ accessType: 'blocklist', subsetData })
    const fromBytes = new AccessList({ accessType: 'blocklist', bytesData })
    const fromPacked = new AccessList({ accessType: 'blocklist', packedData })
    expect(fromSubset).to.be.deep.equal(fromBytes)
    expect(fromPacked).to.be.deep.equal(fromBytes)
  }).timeout(N * 200)

  it('should have matching JSON for all three constructor methods (allowlist)', () => {
    const fromSubset = new AccessList({ accessType: 'allowlist', subsetData })
    const fromBytes = new AccessList({ accessType: 'allowlist', bytesData })
    const fromPacked = new AccessList({ accessType: 'allowlist', packedData })
    expect(fromSubset.toJSON()).to.be.deep.equal(fromBytes.toJSON())
    expect(fromPacked.toJSON()).to.be.deep.equal(fromBytes.toJSON())
  }).timeout(N * 200)

  it('should have matching JSON for all three constructor methods (blocklist)', () => {
    const fromSubset = new AccessList({ accessType: 'blocklist', subsetData })
    const fromBytes = new AccessList({ accessType: 'blocklist', bytesData })
    const fromPacked = new AccessList({ accessType: 'blocklist', packedData })
    expect(fromSubset.toJSON()).to.be.deep.equal(fromBytes.toJSON())
    expect(fromPacked.toJSON()).to.be.deep.equal(fromBytes.toJSON())
  }).timeout(N * 200)

  it('incremental list should match fully instantiated list (allowlist)', () => {
    const instaList = new AccessList({ accessType: 'allowlist', subsetData })
    const incrementList = new AccessList({ accessType: 'allowlist' })
    for (const v of subsetData) {
      incrementList.insert(v)
    }
    expect(incrementList).to.be.deep.equal(instaList)
  }).timeout(N * 200)

  it('incremental list should match fully instantiated list (blocklist)', () => {
    const instaList = new AccessList({ accessType: 'blocklist', subsetData })
    const incrementList = new AccessList({ accessType: 'blocklist' })
    for (const v of subsetData) {
      incrementList.insert(v)
    }
    expect(incrementList).to.be.deep.equal(instaList)
  }).timeout(N * 200)

  it('allowlist should have the empty root', () => {
    const allowlist = new AccessList({ accessType: 'allowlist' })
    expect(allowlist.root).to.be.deep.equal(allowlistZeros[20])
  })

  it('blocklist should have the empty root', () => {
    const blocklist = new AccessList({ accessType: 'blocklist' })
    expect(blocklist.root).to.be.deep.equal(blocklistZeros[20])
  })

  it('full empty list (after being updated) should match fully instantiated list (allowlist)', () => {
    const instaList = new AccessList({ accessType: 'allowlist', subsetData })
    const emptyList = AccessList.fullEmpty({ accessType: 'allowlist', subsetLength: instaList.length })
    for (let i = 0; i < instaList.length; i++) {
      emptyList.update(i, subsetData[i])
    }
    expect(emptyList).to.be.deep.equal(instaList)
  }).timeout(N * 200)

  it('full empty list (after being updated) should match fully instantiated list (blocklist)', () => {
    const instaList = new AccessList({ accessType: 'blocklist', subsetData })
    const emptyList = AccessList.fullEmpty({ accessType: 'blocklist', subsetLength: instaList.length })
    for (let i = 0; i < instaList.length; i++) {
      emptyList.update(i, subsetData[i])
    }
    expect(emptyList).to.be.deep.equal(instaList)
  }).timeout(N * 200)

  it('empty list (after being `extend`ed, after being updated) should match fully instantiated list (allowlist)', () => {
    const instaList = new AccessList({ accessType: 'allowlist', subsetData })
    const emptyList = new AccessList({ accessType: 'allowlist' })
    emptyList.extend(instaList.length)
    for (let i = 0; i < instaList.length; i++) {
      emptyList.update(i, subsetData[i])
    }
    expect(emptyList).to.be.deep.equal(instaList)
  }).timeout(N * 200)

  it('empty list (after being `extend`ed, after being updated) should match fully instantiated list (blocklist)', () => {
    const instaList = new AccessList({ accessType: 'blocklist', subsetData })
    const emptyList = new AccessList({ accessType: 'blocklist' })
    emptyList.extend(instaList.length)
    for (let i = 0; i < instaList.length; i++) {
      emptyList.update(i, subsetData[i])
    }
    expect(emptyList).to.be.deep.equal(instaList)
  }).timeout(N * 200)

  it('partial list (after being `extend`ed, after being updated) should match fully instantiated list (allowlist)', () => {
    const instaList = new AccessList({ accessType: 'allowlist', subsetData })
    const partialList = new AccessList({ accessType: 'allowlist', subsetData: subsetData.slice(0, randomSplitIndex) })
    partialList.extend(instaList.length)
    for (let i = randomSplitIndex; i < instaList.length; i++) {
      partialList.update(i, subsetData[i])
    }
    expect(partialList).to.be.deep.equal(instaList)
  }).timeout(N * 200)

  it('partial list (after being `extend`ed, after being updated) should match fully instantiated list (blocklist)', () => {
    const instaList = new AccessList({ accessType: 'blocklist', subsetData })
    const partialList = new AccessList({ accessType: 'blocklist', subsetData: subsetData.slice(0, randomSplitIndex) })
    partialList.extend(instaList.length)
    for (let i = randomSplitIndex; i < instaList.length; i++) {
      partialList.update(i, subsetData[i])
    }
    expect(partialList).to.be.deep.equal(instaList)
  }).timeout(N * 200)

  it('getWindow should match subset slice (allowlist)', () => {
    const start = subsetData.length - 25
    const end = subsetData.length
    const accessList = new AccessList({ accessType: 'allowlist', subsetData })
    const subsetWindow = accessList.getWindow(start, end)
    expect(subsetWindow).to.be.deep.equal(subsetData.slice(start, end))
  })

  it('getWindow should match subset slice (blocklist)', () => {
    const start = subsetData.length - 25
    const end = subsetData.length
    const accessList = new AccessList({ accessType: 'blocklist', subsetData })
    const subsetWindow = accessList.getWindow(start, end)
    expect(subsetWindow).to.be.deep.equal(subsetData.slice(start, end))
  })

  it('setWindow should correctly update subset slice (allowlist)', () => {
    const start = subsetData.length - 25
    const end = subsetData.length
    const accessList = new AccessList({ accessType: 'allowlist', subsetData })
    const initialWindow = accessList.getWindow(start, end)
    const expectedWindow = initialWindow.map((value) => value ? 0 : 1)
    accessList.setWindow(start, end, expectedWindow)
    const finalWindow = accessList.getWindow(start, end)
    expect(finalWindow).to.be.deep.equal(expectedWindow)
  })

  it('setWindow should correctly update subset slice (blocklist)', () => {
    const start = subsetData.length - 25
    const end = subsetData.length
    const accessList = new AccessList({ accessType: 'blocklist', subsetData })
    const initialWindow = accessList.getWindow(start, end)
    const expectedWindow = initialWindow.map((value) => value ? 0 : 1)
    accessList.setWindow(start, end, expectedWindow)
    const finalWindow = accessList.getWindow(start, end)
    expect(finalWindow).to.be.deep.equal(expectedWindow)
  })
})
