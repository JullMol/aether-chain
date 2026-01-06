package vm

import (
	"context"
	"fmt"
	"os"

	"github.com/tetratelabs/wazero"
	"github.com/tetratelabs/wazero/imports/wasi_snapshot_preview1"
)

type Executor struct {
	Runtime wazero.Runtime
}

func NewExecutor(ctx context.Context) *Executor {
	r := wazero.NewRuntime(ctx)
	wasi_snapshot_preview1.MustInstantiate(ctx, r)

	return &Executor{Runtime: r}
}

func (e *Executor) ExecuteContract(ctx context.Context, wasmCode []byte, functionName string, params ...uint64) error {
	mod, err := e.Runtime.CompileModule(ctx, wasmCode)
	if err != nil {
		return fmt.Errorf("failed to compile wasm: %w", err)
	}

	m, err := e.Runtime.InstantiateModule(ctx, mod, wazero.NewModuleConfig().WithStdout(os.Stdout))
	if err != nil {
		return fmt.Errorf("failed to instantiate module: %w", err)
	}
	defer m.Close(ctx)

	fn := m.ExportedFunction(functionName)
	if fn == nil {
		return fmt.Errorf("function %s not found in contract", functionName)
	}

	_, err = fn.Call(ctx, params...)
	return err
}