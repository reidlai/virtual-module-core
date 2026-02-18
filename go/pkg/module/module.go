// Package module provides core interfaces and base structures for virtual modules.
package module

import (
	"context"
	"net/http"

	goahttp "goa.design/goa/v3/http"
)

// HTTPRegistrar is an interface for modules that can register HTTP handlers (Goa-based)
// Goa endpoints are mounted on Chi router and inherit all Chi middleware
type HTTPRegistrar interface {
	RegisterHTTP(
		mux goahttp.Muxer,
		dec func(*http.Request) goahttp.Decoder,
		enc func(context.Context, http.ResponseWriter) goahttp.Encoder,
		eh func(context.Context, http.ResponseWriter, error),
	) []MountPoint
}

// Registrar is the base interface that all modules must implement.
// Modules can optionally implement:
//   - HTTPRegistrar: For REST API endpoints (Goa-based, mounted on Chi)
//   - Neither: Utility modules that only provide shared functionality
type Registrar interface {
	Name() string
}

// MountPoint represents a single HTTP mount point for logging
type MountPoint struct {
	Method  string
	Verb    string
	Pattern string
}

// Module is a base struct that can be embedded by specific module implementations.
// Specific modules should embed this and add their own fields (e.g., endpoints).
type Module struct {
	name string
}

// NewModule creates a new base Module with the given name
func NewModule(name string) Module {
	return Module{name: name}
}

// Name returns the module name
func (m *Module) Name() string {
	return m.name
}
