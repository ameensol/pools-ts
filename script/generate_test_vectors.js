// const fs = require('fs')
// const { poseidon } = require('../dist/poseidon.js')

// const testVectors = []
// const seed = [1, 2]
// const commitments = []
// const extendedSecrets = []
// const hdSecretGeneratorNodes = []

// (function main(){
//     let extendedSecret = seed
//     for (let i = 0; i < 10; i++) {
//       extendedSecret = poseidon(extendedSecret.slice(0, 2), 3)
//       extendedSecrets.push(extendedSecret)

//       commitments.push(poseidon(extendedSecret.slice(0, 2), 3))

//     }
// })()

// TODO: add test vectors for HDSecretGenerator