package physics

import (
	"math"
)

// PlanetParams holds the calculated physics for a planet.
type PlanetParams struct {
	Mass             float64 `json:"mass"`
	OrbitRadius      float64 `json:"orbitRadius"`
	Eccentricity     float64 `json:"eccentricity"`
	OrbitInclination float64 `json:"orbitInclination"`
	PhaseOffset      float64 `json:"phaseOffset"`
	OrbitalSpeed     float64 `json:"orbitalSpeed"`
	TextureSeed      int     `json:"textureSeed"`
}

// CalculatePlanetParams computes orbital physics for a planet.
//   - wordCount: number of characters/words in the article
//   - index: position among sibling planets (0-based)
//   - seed: deterministic seed (e.g. from ID)
func CalculatePlanetParams(wordCount int, index int, seed uint64) PlanetParams {
	mass := massFromWordCount(wordCount)
	orbitRadius := orbitRadiusFromIndex(index, seed)
	orbitalSpeed := keplerSpeed(orbitRadius)

	// Deterministic jitter for eccentricity and inclination
	ecc := deterministicFloat(seed, 0) * MaxEccentricity
	incl := (deterministicFloat(seed, 1) - 0.5) * 0.2 // [-0.1, 0.1] radians
	phase := deterministicFloat(seed, 2) * 2 * math.Pi

	return PlanetParams{
		Mass:             mass,
		OrbitRadius:      orbitRadius,
		Eccentricity:     ecc,
		OrbitInclination: incl,
		PhaseOffset:      phase,
		OrbitalSpeed:     orbitalSpeed,
		TextureSeed:      int(seed % 10000),
	}
}

// massFromWordCount: log2(wordCount+1) * 0.5 + 1.0
func massFromWordCount(wordCount int) float64 {
	return math.Log2(float64(wordCount)+1)*MassLogFactor + MassBaseOffset
}

// orbitRadiusFromIndex: BaseRadius + index * Spacing + deterministic_jitter
func orbitRadiusFromIndex(index int, seed uint64) float64 {
	jitter := (deterministicFloat(seed, 3) - 0.5) * 2 * OrbitJitterMax
	return BaseOrbitRadius + float64(index)*OrbitSpacing + jitter
}

// keplerSpeed: K / sqrt(r^3), floored at MinOrbitalSpeed
func keplerSpeed(r float64) float64 {
	speed := KeplerConstant / math.Sqrt(r*r*r)
	if speed < MinOrbitalSpeed {
		return MinOrbitalSpeed
	}
	return speed
}

// deterministicFloat returns a float64 in [0, 1) from a seed and offset.
func deterministicFloat(seed uint64, offset uint64) float64 {
	// Simple hash-based PRNG
	h := seed*2654435761 + offset*40503
	h = (h ^ (h >> 16)) * 0x45d9f3b
	h = (h ^ (h >> 16)) * 0x45d9f3b
	h = h ^ (h >> 16)
	return float64(h%10000) / 10000.0
}
