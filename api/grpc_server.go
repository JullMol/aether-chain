package api

import (
	"context"
	"net"

	"github.com/JullMol/aether-chain/core/engine"
	pb "github.com/JullMol/aether-chain/proto"
	"google.golang.org/grpc"
)

type Server struct {
	pb.UnimplementedAetherServiceServer
	Manager *engine.ChainManager
}

func (s *Server) SubmitData(ctx context.Context, req *pb.DataRequest) (*pb.DataResponse, error) {
	err := s.Manager.Write(req.Key, req.Value)
	if err != nil {
		return nil, err
	}

	return &pb.DataResponse{
		Status: "Data Committed to Aether-Chain",
	}, nil
}

func StartGRPC(manager *engine.ChainManager, port string) {
	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		return
	}
	s := grpc.NewServer()
	pb.RegisterAetherServiceServer(s, &Server{Manager: manager})
	
	go s.Serve(lis)
}