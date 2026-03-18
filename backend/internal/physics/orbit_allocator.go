package physics

import "math"

// OrbitAllocation holds a batch of allocated planet orbits.
type OrbitAllocation struct {
	Params []PlanetParams
}

// AllocateOrbits computes non-colliding orbits for a batch of planets.
// Each planet gets a unique orbit radius with minimum spacing enforced.
func AllocateOrbits(planets []PlanetInput) OrbitAllocation {
	alloc := OrbitAllocation{
		Params: make([]PlanetParams, len(planets)),
	}

	for i, p := range planets {
		params := CalculatePlanetParams(p.WordCount, i, p.Seed)

		// Collision avoidance: ensure minimum spacing from all previous orbits
		for j := 0; j < i; j++ {
			if math.Abs(params.OrbitRadius-alloc.Params[j].OrbitRadius) < OrbitSpacing*0.5 {
				params.OrbitRadius = alloc.Params[j].OrbitRadius + OrbitSpacing*0.5
				params.OrbitalSpeed = keplerSpeed(params.OrbitRadius)
			}
		}

		alloc.Params[i] = params
	}

	return alloc
}

// PlanetInput describes a planet for batch orbit allocation.
type PlanetInput struct {
	WordCount int
	Seed      uint64
}
