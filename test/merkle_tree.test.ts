import { expect } from 'chai'
import { BigNumber } from '@ethersproject/bignumber'
import { MerkleTree, verifyProof } from '../src/merkle_tree'
import { ALLOWED } from '../src/common'
import { poseidon } from '../src/poseidon'

var optionalFullTest = 0

describe('merkle_tree.ts', function() {
  let merkleTree: MerkleTree
  let zeroValues: BigNumber[]

  before(() => {
    zeroValues = [ALLOWED]
    for (let i = 0; i < 20; i++) {
      zeroValues[i+1] = poseidon([zeroValues[i], zeroValues[i]], 1) as BigNumber
    }
    merkleTree = new MerkleTree({ leaves: [], zeroString: 'allowed' })
  })

  it('should verify arbitrary index empty proofs', () => {
    for (let i = 0; i < 5; i++) {
      const path = Math.ceil(Math.random() * 2**20)
      expect(verifyProof({
        root: zeroValues[20],
        leaf: zeroValues[0],
        path,
        siblings: zeroValues.slice(0, 20)
      })).to.be.true
    }
  }).timeout(3000)

  it('should instantiate a valid "empty" tree of random length < 10,000', () => {
    const treeLength = Math.ceil(Math.random() * 10000)
    console.log({treeLength})
    console.time('fastTree')
    const fastTree = MerkleTree.fullEmpty({ treeLength, zero: ALLOWED })
    console.timeEnd('fastTree')
    console.time('slowTree')
    const slowTree = new MerkleTree({
      leaves: (new Array(treeLength)).fill(ALLOWED),
      zero: ALLOWED
    })
    console.timeEnd('slowTree')
    expect(JSON.stringify(fastTree)).to.be.equal(JSON.stringify(slowTree))
  }).timeout(30000)

  it('empty tree should have expected zeroValues', () => {
    expect(merkleTree.zeroValues).to.be.deep.equal(zeroValues)
  })

  it('empty tree should have expected root', () => {
    expect(merkleTree.root).to.be.deep.equal(zeroValues[20])
  })

  it('an incremental tree root should match a constructed tree root', () => {
    expect(merkleTree.insert(42)).to.be.equal(0)
    expect(merkleTree.insert(69)).to.be.equal(1)
    expect(merkleTree.insert(420)).to.be.equal(2)

    const tree = new MerkleTree({ leaves: [42, 69, 420], zeroString: 'allowed' })
    expect(tree.root).to.be.deep.equal(merkleTree.root)
  })

  it('should compute valid merkle proofs', () => {
    for (let i = 0; i < merkleTree.length; i++) {
      expect(merkleTree.verifyProof(merkleTree.generateProof(i))).to.be.true
    }
  })

  it('should process updates correctly', () => {
    merkleTree.update(0, 216)
    let tree = new MerkleTree({ leaves: [216, 69, 420], zeroString: 'allowed' })
    expect(tree.root).to.be.deep.equal(merkleTree.root)

    merkleTree.update(1, 343)
    tree = new MerkleTree({ leaves: [216, 343, 420], zeroString: 'allowed' })
    expect(tree.root).to.be.deep.equal(merkleTree.root)

    merkleTree.update(2, 512)
    tree = new MerkleTree({ leaves: [216, 343, 512], zeroString: 'allowed' })
    expect(tree.root).to.be.deep.equal(merkleTree.root)
  }).timeout(10000)

  it('should JSON.stringify correctly', () => {
    const stringifiedTree = JSON.stringify(merkleTree)
    const restoredTreeFromString = MerkleTree.fromString(stringifiedTree)
    expect(merkleTree.root).to.be.deep.equal(restoredTreeFromString.root)
    expect(merkleTree.leaves).to.be.deep.equal(restoredTreeFromString.leaves)

    const restoredTreeFromJSON = MerkleTree.fromJSON(JSON.parse(stringifiedTree))
    expect(merkleTree.root).to.be.deep.equal(restoredTreeFromJSON.root)
    expect(merkleTree.leaves).to.be.deep.equal(restoredTreeFromJSON.leaves)
  })

  it('should reject inserts with invalid leaf', () => {
    expect(function() {
      merkleTree.insert('asdf' as unknown as BigNumber)
    }).to.throw
  })

  it('should reject updates with invalid leaf', () => {
    expect(function() {
      merkleTree.update(0, 'asdf' as unknown as BigNumber)
    }).to.throw
  })

  it('should reject updates with invalid index', () => {
    expect(function() {
      merkleTree.update({} as unknown as number, BigNumber.from(0))
    }).to.throw
  })

  it('should reject updates beyond the latest index', () => {
    expect(function() {
      merkleTree.update(500, BigNumber.from(0))
    }).to.throw
  })

  if (optionalFullTest) {
    it('should instantiate a valid full zeros tree', () => {
      const massiveLength = 131071
      console.time('massiveFastTree')
      const massiveFastTree = MerkleTree.fullEmpty({ treeLength: massiveLength, zero: ALLOWED, levels: 17 })
      console.timeEnd('massiveFastTree')
      console.log('testing slow tree: expect ~5 minutes calculation')
      console.time('massiveSlowTree')
      const massiveSlowTree = new MerkleTree({ leaves: (new Array(massiveLength)).fill(ALLOWED), zero: ALLOWED, levels: 17 })
      console.timeEnd('massiveSlowTree')
      expect(JSON.stringify(massiveFastTree)).to.be.equal(JSON.stringify(massiveSlowTree))
    }).timeout(360000)
  }

})
