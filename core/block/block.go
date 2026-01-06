package block

import (
	"crypto/sha256"
	"encoding/binary"
	"fmt"
	"time"
)

type Header struct {
	Version    uint32
	Timestamp  int64
	PrevHash   [32]byte
	MerkleRoot [32]byte
	DataLen    uint32
}

type Block struct {
	Header Header
	Data   []byte
}

func (h *Header) CalculateHash() [32]byte {
	record := make([]byte, 0, 80)
	
	tBuf := make([]byte, 8)
	binary.LittleEndian.PutUint64(tBuf, uint64(h.Timestamp))
	
	vBuf := make([]byte, 4)
	binary.LittleEndian.PutUint32(vBuf, h.Version)

	lBuf := make([]byte, 4)
	binary.LittleEndian.PutUint32(lBuf, h.DataLen)

	record = append(record, vBuf...)
	record = append(record, tBuf...)
	record = append(record, h.PrevHash[:]...)
	record = append(record, h.MerkleRoot[:]...)
	record = append(record, lBuf...)

	return sha256.Sum256(record)
}

func (h *Header) String() string {
	return fmt.Sprintf("Block[Time: %v | Prev: %x | Root: %x]", 
		time.Unix(h.Timestamp, 0).Format(time.RFC822), 
		h.PrevHash[:4], 
		h.MerkleRoot[:4],
	)
}