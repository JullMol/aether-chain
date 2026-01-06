package p2p

import (
	"context"
	"github.com/libp2p/go-libp2p-pubsub"
	"github.com/libp2p/go-libp2p/core/host"
)

type AetherGossip struct {
	PubSub *pubsub.PubSub
	Topic  *pubsub.Topic
	Sub    *pubsub.Subscription
	Messages chan []byte
}

func JoinChatRoom(ctx context.Context, h host.Host, topicName string) (*AetherGossip, error) {
	ps, err := pubsub.NewGossipSub(ctx, h)
	if err != nil {
		return nil, err
	}

	topic, err := ps.Join(topicName)
	if err != nil {
		return nil, err
	}
	sub, err := topic.Subscribe()
	if err != nil {
		return nil, err
	}

	g := &AetherGossip{
		PubSub:   ps,
		Topic:    topic,
		Sub:      sub,
		Messages: make(chan []byte, 100),
	}

	go g.readLoop(ctx)

	return g, nil
}

func (g *AetherGossip) readLoop(ctx context.Context) {
	for {
		msg, err := g.Sub.Next(ctx)
		if err != nil {
			close(g.Messages)
			return
		}
		g.Messages <- msg.Data
	}
}
func (g *AetherGossip) Publish(ctx context.Context, data []byte) error {
	return g.Topic.Publish(ctx, data)
}