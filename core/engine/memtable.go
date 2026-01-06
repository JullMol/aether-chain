package engine

import (
	"math/rand"
	"sync"
)

const MaxLevel = 16

type Node struct {
	key		string
	value	[]byte
	next	[]*Node
}

type Memtable struct {
	mu 		sync.RWMutex
	head 	*Node
	level 	int
	size  	int
}

func NewMemtable() *Memtable {
	return &Memtable{
		head: &Node{next: make([]*Node, MaxLevel)},
		level: 1,
	}
}

func (m *Memtable) Put(key string, value []byte) {
	m.mu.Lock()
	defer m.mu.Unlock()

	update := make([]*Node, MaxLevel)
	curr := m.head

	for i := m.level - 1; i >= 0; i-- {
		for curr.next[i] != nil && curr.next[i].key < key {
			curr = curr.next[i]
		}
		update[i] = curr
	}

	lvl := m.randomLevel()
	if lvl > m.level {
		for i := m.level; i < lvl; i++ {
			update[i] = m.head
		}
		m.level = lvl
	}

	newNode := &Node{
		key:   key,
		value: value,
		next:  make([]*Node, lvl),
	}

	for i := 0; i < lvl; i++ {
		newNode.next[i] = update[i].next[i]
		update[i].next[i] = newNode
	}
	m.size += len(key) + len(value)
}

func (m *Memtable) randomLevel() int {
	lvl := 1
	for rand.Float32() < 0.5 && lvl < MaxLevel {
		lvl++
	}
	return lvl
}

func (m *Memtable) Size() int {
	return m.size
}