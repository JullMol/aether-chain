package engine

import (
	"context"
	"fmt"
	"sync"

	"github.com/JullMol/aether-chain/core/vm"
)

type ChainManager struct {
	mu           sync.Mutex
	activeMem    *Memtable
	lastSSTHash  [32]byte
	basePath     string
	sstCount     int
	OnBlockCreated func(hash string, prevHash string) // Callback event
}

func NewChainManager(basePath string) *ChainManager {
	return &ChainManager{
		activeMem: NewMemtable(),
		basePath:  basePath,
	}
}

func (cm *ChainManager) Write(key string, value []byte) error {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	cm.activeMem.Put(key, value)

	if cm.activeMem.Size() > 10240 { 
		return cm.rotateSSTable()
	}

	return nil
}

func (cm *ChainManager) WriteWithValidation(ctx context.Context, key string, value []byte, wasmContract []byte) error {
	executor := vm.NewExecutor(ctx)
	err := executor.ExecuteContract(ctx, wasmContract, "validate", uint64(len(value)))
	if err != nil {
		return fmt.Errorf("contract rejected the data: %w", err)
	}

	return cm.Write(key, value)
}

func (cm *ChainManager) ListBlocks() []string {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	var blocks []string
	for i := 1; i <= cm.sstCount; i++ {
		blocks = append(blocks, fmt.Sprintf("block_%03d.sst", i))
	}
	return blocks
}

func (cm *ChainManager) GetBlockCount() int {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	return cm.sstCount
}

func (cm *ChainManager) rotateSSTable() error {
	cm.sstCount++
	filename := fmt.Sprintf("%s/block_%03d.sst", cm.basePath, cm.sstCount)
	fmt.Printf("Rotating SSTable: Flushing to %s...\n", filename)

	newHash, err := FlushMemtable(cm.activeMem, filename, cm.lastSSTHash)
	if err != nil {
		return err
	}
	cm.lastSSTHash = newHash
	
	// Trigger event if callback is set
	if cm.OnBlockCreated != nil {
		go cm.OnBlockCreated(fmt.Sprintf("%x", newHash), fmt.Sprintf("%x", cm.lastSSTHash))
	}

	cm.activeMem = NewMemtable()

	return nil
}