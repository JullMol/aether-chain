package engine

import (
	"crypto/sha256"
	"encoding/binary"
	"fmt"
	"os"
	"time"

	"github.com/JullMol/aether-chain/core/block"
	"github.com/JullMol/aether-chain/pkg/crypto"
)

type SSTable struct {
	file *os.File
}

func FlushMemtable(m *Memtable, path string, prevHash [32]byte) ([32]byte, error) {
	f, err := os.Create(path)
	if err != nil {
		return [32]byte{}, err
	}
	defer f.Close()

	var dataBuffer []byte
	var dataHashes [][32]byte

	curr := m.head.next[0]
	for curr != nil {
		rowHash := sha256.Sum256(append([]byte(curr.key), curr.value...))
		dataHashes = append(dataHashes, rowHash)
		keyLen := uint32(len(curr.key))
		valLen := uint32(len(curr.value))

		tempBuf := make([]byte, 8+len(curr.key)+len(curr.value))
		
		binary.LittleEndian.PutUint32(tempBuf[0:4], keyLen)
		copy(tempBuf[4:4+len(curr.key)], curr.key)
		
		valStart := 4 + len(curr.key)
		binary.LittleEndian.PutUint32(tempBuf[valStart:valStart+4], valLen)
		copy(tempBuf[valStart+4:], curr.value)

		dataBuffer = append(dataBuffer, tempBuf...)
		curr = curr.next[0]
	}

	merkleRoot := crypto.CalculateMerkleRoot(dataHashes)

	header := block.Header{
		Version:    1,
		Timestamp:  time.Now().Unix(),
		PrevHash:   prevHash,
		MerkleRoot: merkleRoot,
		DataLen:    uint32(len(dataBuffer)),
	}

	currentBlockHash := header.CalculateHash()
	fmt.Printf("New Block Hash: %x\n", currentBlockHash)

	err = binary.Write(f, binary.LittleEndian, header)
	if err != nil {
		return [32]byte{}, err
	}
	_, err = f.Write(dataBuffer)
	if err != nil {
		return [32]byte{}, err
	}

	return currentBlockHash, nil
}