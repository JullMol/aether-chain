package main

import (
	"context"
	"fmt"
	"os"

	"github.com/JullMol/aether-chain/api"
	"github.com/JullMol/aether-chain/core/engine"
	"github.com/JullMol/aether-chain/p2p"
	"github.com/spf13/cobra"
)

var (
	port     int
	dbPath   string
	rootCmd  = &cobra.Command{Use: "aetherd"}
)

func init() {
	rootCmd.PersistentFlags().IntVarP(&port, "port", "p", 6001, "Port for P2P node")
	rootCmd.PersistentFlags().StringVarP(&dbPath, "data", "d", "./data", "Data directory path")
}

func main() {
	startCmd := &cobra.Command{
		Use:   "start",
		Short: "Start the Aether-Chain node",
		Run: func(cmd *cobra.Command, args []string) {
			runNode()
		},
	}

	benchCmd := &cobra.Command{
		Use:   "bench",
		Short: "Run write load benchmark test",
		Run: func(cmd *cobra.Command, args []string) {
			runBenchmark()
		},
	}

	rootCmd.AddCommand(startCmd, benchCmd)
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func runNode() {
	ctx := context.Background()
	os.MkdirAll(dbPath, 0755)

	manager := engine.NewChainManager(dbPath)

	node, err := p2p.InitNode(ctx, port)
	if err != nil {
		panic(err)
	}

	manager.OnBlockCreated = func(hash, prevHash string) {
		id := fmt.Sprintf("%03d", manager.GetBlockCount())
		hashShort := "0x" + hash
		api.GlobalHub.BroadcastBlock(id, hashShort)
	}

	gossip, _ := p2p.JoinChatRoom(ctx, node, "aether-blocks")
	peerChan, _ := p2p.SetupDiscovery(node)

	fmt.Printf("\n🚀 Aether-Chain is LIVE on port %d\n", port)
	fmt.Printf("📂 Storage path: %s\n", dbPath)
	
	fmt.Printf("📡 gRPC API Server running on port 50051\n")
	api.StartGRPC(manager, "50051")

	fmt.Printf("🌐 HTTP API Server running on port 8080\n")
	api.StartHTTPServer(manager, "8080")

	go func() {
		for msg := range gossip.Messages {
			fmt.Printf("\n[NETWORK] Incoming Block Update: %s\n", string(msg))
		}
	}()

	for peer := range peerChan {
		node.Connect(ctx, peer)
	}
}

func runBenchmark() {
	fmt.Println("🚀 Running performance benchmark...")
	manager := engine.NewChainManager(dbPath)
	for i := 0; i < 5000; i++ {
		manager.Write(fmt.Sprintf("key-%d", i), []byte("performance_test_data"))
	}
	fmt.Println("✅ Benchmark complete. Check your data folder!")
}