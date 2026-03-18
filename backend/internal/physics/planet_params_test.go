package physics

import (
	"math"
	"testing"
)

func TestMassFromWordCount(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		wordCount int
		wantMin   float64
		wantMax   float64
	}{
		{"zero words", 0, 1.0, 1.01},
		{"100 words", 100, 4.0, 4.5},
		{"1000 words", 1000, 5.5, 6.5},
		{"10000 words", 10000, 7.0, 8.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			mass := massFromWordCount(tt.wordCount)
			if mass < tt.wantMin || mass > tt.wantMax {
				t.Errorf("massFromWordCount(%d) = %f, want in [%f, %f]",
					tt.wordCount, mass, tt.wantMin, tt.wantMax)
			}
		})
	}
}

func TestCalculatePlanetParams_Determinism(t *testing.T) {
	t.Parallel()

	p1 := CalculatePlanetParams(500, 3, 42)
	p2 := CalculatePlanetParams(500, 3, 42)

	if p1 != p2 {
		t.Errorf("CalculatePlanetParams not deterministic: %+v != %+v", p1, p2)
	}
}

func TestCalculatePlanetParams_DifferentSeeds(t *testing.T) {
	t.Parallel()

	p1 := CalculatePlanetParams(500, 0, 1)
	p2 := CalculatePlanetParams(500, 0, 2)

	if p1.PhaseOffset == p2.PhaseOffset {
		t.Error("different seeds should produce different phase offsets")
	}
}

func TestOrbitRadiusIncreases(t *testing.T) {
	t.Parallel()

	prev := 0.0
	for i := 0; i < 10; i++ {
		r := orbitRadiusFromIndex(i, 42)
		if r <= prev-OrbitJitterMax*2 {
			t.Errorf("orbit radius did not increase: index %d has radius %f (prev %f)", i, r, prev)
		}
		prev = r
	}
}

func TestKeplerSpeed(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		radius float64
	}{
		{"close orbit", 2.0},
		{"medium orbit", 10.0},
		{"far orbit", 50.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			speed := keplerSpeed(tt.radius)
			expected := KeplerConstant / math.Sqrt(tt.radius*tt.radius*tt.radius)
			if expected < MinOrbitalSpeed {
				expected = MinOrbitalSpeed
			}
			if math.Abs(speed-expected) > 1e-10 {
				t.Errorf("keplerSpeed(%f) = %f, want %f", tt.radius, speed, expected)
			}
		})
	}
}

func TestMassMonotonicallyIncreases(t *testing.T) {
	t.Parallel()

	prev := 0.0
	for _, wc := range []int{0, 10, 100, 500, 1000, 5000, 10000} {
		mass := massFromWordCount(wc)
		if mass <= prev {
			t.Errorf("mass should increase: wordCount=%d mass=%f prev=%f", wc, mass, prev)
		}
		prev = mass
	}
}
