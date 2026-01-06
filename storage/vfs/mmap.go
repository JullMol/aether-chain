package vfs

import (
	"os"
	"github.com/edsrzf/mmap-go"
)

func MmapFile(path string) (mmap.MMap, error) {
	f, err := os.OpenFile(path, os.O_RDONLY, 0)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	data, err := mmap.Map(f, mmap.RDONLY, 0)
	if err != nil {
		return nil, err
	}
	
	return data, nil
}