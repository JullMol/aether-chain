package p2p

import (
	"fmt"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/p2p/discovery/mdns"
)

type DiscoveryNotif struct {
	PeerChan chan peer.AddrInfo
}

func (n *DiscoveryNotif) HandlePeerFound(pi peer.AddrInfo) {
	fmt.Printf("Found new peer: %s\n", pi.ID.String())
	n.PeerChan <- pi
}

func SetupDiscovery(h host.Host) (chan peer.AddrInfo, error) {
	peerChan := make(chan peer.AddrInfo)
	n := &DiscoveryNotif{PeerChan: peerChan}
	ser := mdns.NewMdnsService(h, "aether-chain-discovery", n)
	if err := ser.Start(); err != nil {
		return nil, err
	}

	return peerChan, nil
}