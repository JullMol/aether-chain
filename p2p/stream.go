package p2p

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
)

func RegisterSyncHandler(h host.Host, dataDir string) {
	h.SetStreamHandler(SyncProtocolID, func(s network.Stream) {
		defer s.Close()
		fmt.Printf("[SYNC] Outgoing: Sending block to %s\n", s.Conn().RemotePeer())

		rw := bufio.NewReadWriter(bufio.NewReader(s), bufio.NewWriter(s))
		fileName, err := rw.ReadString('\n')
		if err != nil {
			return
		}
		fileName = fileName[:len(fileName)-1]

		filePath := filepath.Join(dataDir, fileName)
		file, err := os.Open(filePath)
		if err != nil {
			fmt.Printf("[SYNC] File %s not found\n", fileName)
			return
		}
		defer file.Close()

		_, err = io.Copy(s, file)
		if err != nil {
			fmt.Println("[SYNC] Error sending file:", err)
		}
		fmt.Printf("[SYNC] Block %s sent successfully!\n", fileName)
	})
}

func RequestBlock(ctx context.Context, h host.Host, p peer.ID, blockName string, destDir string) error {
	s, err := h.NewStream(ctx, p, SyncProtocolID)
	if err != nil {
		return err
	}
	defer s.Close()

	fmt.Fprintf(s, "%s\n", blockName)

	destPath := filepath.Join(destDir, blockName)
	out, err := os.Create(destPath)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, s)
	return err
}