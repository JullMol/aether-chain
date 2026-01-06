package api

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Hub struct {
	clients map[*websocket.Conn]bool
	mu      sync.Mutex
}

var GlobalHub = &Hub{
	clients: make(map[*websocket.Conn]bool),
}

func (h *Hub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WS Upgrade Error:", err)
		return
	}
	h.mu.Lock()
	h.clients[conn] = true
	h.mu.Unlock()
}

func (h *Hub) BroadcastBlock(blockID string, hash string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	
	payload := map[string]string{
		"type": "NEW_BLOCK",
		"id":   blockID,
		"hash": hash,
	}

	for client := range h.clients {
		err := client.WriteJSON(payload)
		if err != nil {
			client.Close()
			delete(h.clients, client)
		}
	}
}
