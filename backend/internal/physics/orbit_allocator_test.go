package physics

import (
	"math"
	"testing"
)

func TestAllocateOrbits_Spacing(t *testing.T) {
	t.Parallel()

	planets := []PlanetInput{
		{WordCount: 500, Seed: 1},
		{WordCount: 800, Seed: 2},
		{WordCount: 300, Seed: 3},
		{WordCount: 1200, Seed: 4},
		{WordCount: 200, Seed: 5},
	}

	alloc := AllocateOrbits(planets)

	if len(alloc.Params) != len(planets) {
		t.Fatalf("expected %d params, got %d", len(planets), len(alloc.Params))
	}

	// Check minimum spacing between all orbit pairs
	minSpacing := OrbitSpacing * 0.5
	for i := 0; i < len(alloc.Params); i++ {
		for j := i + 1; j < len(alloc.Params); j++ {
			gap := math.Abs(alloc.Params[i].OrbitRadius - alloc.Params[j].OrbitRadius)
			if gap < minSpacing-0.01 {
				t.Errorf("planets %d and %d too close: gap=%f (min=%f), radii=%f,%f",
					i, j, gap, minSpacing,
					alloc.Params[i].OrbitRadius, alloc.Params[j].OrbitRadius)
			}
		}
	}
}

func TestAllocateOrbits_Stability(t *testing.T) {
	t.Parallel()

	planets := []PlanetInput{
		{WordCount: 500, Seed: 42},
		{WordCount: 800, Seed: 99},
	}

	a1 := AllocateOrbits(planets)
	a2 := AllocateOrbits(planets)

	for i := range a1.Params {
		if a1.Params[i] != a2.Params[i] {
			t.Errorf("allocation not stable: planet %d differs: %+v vs %+v",
				i, a1.Params[i], a2.Params[i])
		}
	}
}

func BenchmarkAllocateOrbits(b *testing.B) {
	planets := make([]PlanetInput, 100)
	for i := range planets {
		planets[i] = PlanetInput{WordCount: 500 + i*100, Seed: uint64(i)}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		AllocateOrbits(planets)
	}
}

func BenchmarkCalculateSatelliteOrbit(b *testing.B) {
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		CalculateSatelliteOrbit(i%100, 100, uint64(i))
	}
}
