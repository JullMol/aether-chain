package crypto

import (
	"crypto/sha256"
)

func CalculateMerkleRoot(hashes [][32]byte) [32]byte {
	if len(hashes) == 0 {
		return [32]byte{}
	}
	if len(hashes) == 1 {
		return hashes[0]
	}

	var nextLevel [][32]byte
	for i := 0; i < len(hashes); i += 2 {
		if i + 1 < len(hashes) {
			combined := append(hashes[i][:], hashes[i+1][:]...)
			nextLevel = append(nextLevel, sha256.Sum256(combined))
		} else {
			combined := append(hashes[i][:], hashes[i][:]...)
			nextLevel = append(nextLevel, sha256.Sum256(combined))
		}
	}
	return CalculateMerkleRoot(nextLevel)
}