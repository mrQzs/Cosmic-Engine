package physics

import (
	"math"
	"testing"
)

func TestSatelliteRingAssignment(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name          string
		commentIndex  int
		totalComments int
		expectedRing  int
	}{
		{"first comment", 0, 1, 0},
		{"7th comment (still ring 0)", 6, 7, 0},
		{"8th comment (still ring 0)", 7, 8, 0},
		{"9th comment (ring 1)", 8, 9, 1},
		{"16th comment (ring 1)", 15, 16, 1},
		{"17th comment (ring 2)", 16, 20, 2},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			params := CalculateSatelliteOrbit(tt.commentIndex, tt.totalComments, 42)
			if params.RingIndex != tt.expectedRing {
				t.Errorf("comment %d: ring = %d, want %d", tt.commentIndex, params.RingIndex, tt.expectedRing)
			}
		})
	}
}

func TestSatellitePhaseDistribution(t *testing.T) {
	t.Parallel()

	// 8 comments in ring 0 should have roughly evenly spaced phases
	phases := make([]float64, SatellitesPerRing)
	for i := 0; i < SatellitesPerRing; i++ {
		params := CalculateSatelliteOrbit(i, SatellitesPerRing, uint64(i*1000+1))
		phases[i] = params.PhaseOffset
	}

	// Check that phases span a reasonable range (not all clustered)
	minPhase := phases[0]
	maxPhase := phases[0]
	for _, p := range phases[1:] {
		if p < minPhase {
			minPhase = p
		}
		if p > maxPhase {
			maxPhase = p
		}
	}

	phaseRange := maxPhase - minPhase
	if phaseRange < math.Pi {
		t.Errorf("phase range too narrow: %f (should be > π)", phaseRange)
	}
}

func TestDenseRingMode(t *testing.T) {
	t.Parallel()

	// With 60 comments (> DenseRingThreshold), ring spacing should be narrower
	params10 := CalculateSatelliteOrbit(16, 20, 42)     // ring 2, normal spacing
	params60 := CalculateSatelliteOrbit(16, 60, 42)     // ring 2, dense spacing

	// Dense mode radius should be smaller for same ring index
	if params60.OrbitRadius >= params10.OrbitRadius {
		t.Errorf("dense mode should have smaller radius: dense=%f normal=%f",
			params60.OrbitRadius, params10.OrbitRadius)
	}
}

func TestEquatorialFirstRing(t *testing.T) {
	t.Parallel()

	params := CalculateSatelliteOrbit(0, 10, 42)
	if params.OrbitInclination != 0 {
		t.Errorf("first ring should be equatorial, got inclination = %f", params.OrbitInclination)
	}
}

func TestAlternatingInclination(t *testing.T) {
	t.Parallel()

	// Rings 1 and 2 should have opposite sign inclinations
	ring1 := CalculateSatelliteOrbit(SatellitesPerRing, 30, 42)     // ring 1
	ring2 := CalculateSatelliteOrbit(SatellitesPerRing*2, 30, 42)   // ring 2

	if ring1.OrbitInclination*ring2.OrbitInclination >= 0 {
		t.Errorf("rings 1 and 2 should have opposite inclinations: ring1=%f ring2=%f",
			ring1.OrbitInclination, ring2.OrbitInclination)
	}
}
