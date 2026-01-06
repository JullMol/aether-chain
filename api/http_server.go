package api

import (
	"encoding/json"
	"net/http"

	"github.com/JullMol/aether-chain/core/engine"
)

type HTTPServer struct {
	Manager *engine.ChainManager
}

func StartHTTPServer(manager *engine.ChainManager, port string) {
	server := &HTTPServer{Manager: manager}

	http.HandleFunc("/api/status", server.handleStatus)
	
	http.HandleFunc("/api/blocks", server.handleBlocks)
	
	http.HandleFunc("/ws", GlobalHub.HandleWebSocket)

	go http.ListenAndServe(":"+port, nil)
}

func (s *HTTPServer) handleStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	data := map[string]interface{}{
		"node_id": "Aether-Node-001",
		"status":  "Active",
		"uptime":  "running",
	}
	json.NewEncoder(w).Encode(data)
}

func (s *HTTPServer) handleBlocks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	blocks := s.Manager.ListBlocks()
	json.NewEncoder(w).Encode(map[string]interface{}{
		"blocks": blocks,
		"count":  len(blocks),
	})
}