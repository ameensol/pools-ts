// see: https://github.com/iden3/circomlib/blob/v0.5.5/test/poseidonjs.js
import { expect } from 'chai'
import {
  BytesData,
  PackedData,
  SubsetData,
  packSubsetData,
  unpackSubsetData,
  subsetDataToBytes,
  bytesToSubsetData,
} from '../src/subsets'

var optionalFullTest = 0

describe('subsets.ts', function() {
  it('Should pack and unpack a subset with < 1 word size', () => {
    const subsetData: SubsetData = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1]

    const packedData: PackedData = packSubsetData(subsetData)
    expect(packedData.bitLength).to.be.equal(subsetData.length)
    expect(packedData.data.length).to.be.equal(Math.ceil(subsetData.length/256))

    const unpackedData: number[] = unpackSubsetData(packedData)
    expect(unpackedData).to.be.deep.equal(subsetData)
  })

  it('Should pack and unpack a subset with exactly 1 word size', () => {
    let subsetData: SubsetData = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1]
    for (let i = 0; i < 4; i++) {
      subsetData = [...subsetData, ...subsetData]
    }

    const packedData: PackedData = packSubsetData(subsetData)
    expect(packedData.bitLength).to.be.equal(subsetData.length)
    expect(packedData.data.length).to.be.equal(Math.ceil(subsetData.length/256))

    const unpackedData: number[] = unpackSubsetData(packedData)
    expect(unpackedData).to.be.deep.equal(subsetData)
  })

  it('Should pack and unpack a subset with multiple words with a bitlength multiple of 256', () => {
    let subsetData: SubsetData = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1]
    for (let i = 0; i < 4; i++) {
      subsetData = [...subsetData, ...subsetData]
    }
    subsetData = [...subsetData, ...subsetData, ...subsetData]

    const packedData: PackedData = packSubsetData(subsetData)
    expect(packedData.bitLength).to.be.equal(subsetData.length)
    expect(packedData.data.length).to.be.equal(Math.ceil(subsetData.length/256))

    const unpackedData: number[] = unpackSubsetData(packedData)
    expect(unpackedData).to.be.deep.equal(subsetData)
  })

  it('Should pack and unpack a subset with multiple words with a trailing bitlength', () => {
    let subsetData: SubsetData = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1]
    for (let i = 0; i < 4; i++) {
      subsetData = [...subsetData, ...subsetData]
    }
    subsetData = [...subsetData, ...subsetData, ...subsetData, 1, 1, 1, 1, 1, 1, 1, 1]

    const packedData: PackedData = packSubsetData(subsetData)
    expect(packedData.bitLength).to.be.equal(subsetData.length)
    expect(packedData.data.length).to.be.equal(Math.ceil(subsetData.length/256))

    const unpackedData: number[] = unpackSubsetData(packedData)
    expect(unpackedData).to.be.deep.equal(subsetData)
  })

  it('Should convert subset data with < 1 byte size to bytes', () => {
    const subsetData: SubsetData = [1, 1, 1, 0]

    const subsetBytes: BytesData = subsetDataToBytes(subsetData)
    expect(subsetBytes.bitLength).to.be.equal(subsetData.length)
    expect(subsetBytes.data.length).to.be.equal(Math.ceil(subsetData.length/8))

    const unpackedData: number[] = bytesToSubsetData(subsetBytes)
    expect(unpackedData).to.be.deep.equal(subsetData)
  })

  it('Should convert subset data with exactly 1 byte size to bytes', () => {
    const subsetData: SubsetData = [1, 1, 1, 1, 1, 1, 1, 0]

    const subsetBytes: BytesData = subsetDataToBytes(subsetData)
    expect(subsetBytes.bitLength).to.be.equal(subsetData.length)
    expect(subsetBytes.data.length).to.be.equal(Math.ceil(subsetData.length/8))

    const unpackedData: number[] = bytesToSubsetData(subsetBytes)
    expect(unpackedData).to.be.deep.equal(subsetData)
  })

  it('Should convert subset data with > 1 byte size to bytes', () => {
    const subsetData: SubsetData = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1]

    const subsetBytes: BytesData = subsetDataToBytes(subsetData)
    expect(subsetBytes.bitLength).to.be.equal(subsetData.length)
    expect(subsetBytes.data.length).to.be.equal(Math.ceil(subsetData.length/8))

    const unpackedData: number[] = bytesToSubsetData(subsetBytes)
    expect(unpackedData).to.be.deep.equal(subsetData)
  })

  it('Should convert subset data with > 1 byte size with trailing bits to bytes', () => {
    const subsetData: SubsetData = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1]

    const subsetBytes: BytesData = subsetDataToBytes(subsetData)
    expect(subsetBytes.bitLength).to.be.equal(subsetData.length)
    expect(subsetBytes.data.length).to.be.equal(Math.ceil(subsetData.length/8))

    const unpackedData: number[] = bytesToSubsetData(subsetBytes)
    expect(unpackedData).to.be.deep.equal(subsetData)
  })

  if (optionalFullTest) {
    it('Should compress a subset of 1 million bits to an array of 4096 BigNumbers', () => {
      const subsetData: SubsetData = new Array(1<<20)
      for (let i = 0; i < subsetData.length; i++) {
        subsetData[i] = Math.floor(Math.random() * 2) as (0 | 1)
      }

      const packedData: PackedData = packSubsetData(subsetData)
      expect(packedData.bitLength).to.be.equal(subsetData.length)
      expect(packedData.data.length).to.be.equal(Math.ceil(subsetData.length/256))

      const unpackedData: number[] = unpackSubsetData(packedData)
      expect(unpackedData).to.be.deep.equal(subsetData)
    }).timeout(20000)
  }
})
