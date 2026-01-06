package p2p

import (
	"context"
	"fmt"
	"github.com/libp2p/go-libp2p"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/p2p/protocol/ping"
)

func InitNode(ctx context.Context, port int) (host.Host, error) {
	h, err := libp2p.New(
		libp2p.ListenAddrStrings(fmt.Sprintf("/ip4/0.0.0.0/tcp/%d", port)),
	)
	if err != nil {
		return nil, err
	}

	pingService := &ping.PingService{Host: h}
	h.SetStreamHandler(ping.ID, pingService.PingHandler)

	fmt.Printf("Node started with ID: %s\n", h.ID())
	fmt.Printf("Listening on: %s\n", h.Addrs())

	return h, nil
}