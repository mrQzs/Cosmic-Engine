package physics

import (
	"math"
	"time"
)

// Asteroid belt constants
const (
	AsteroidBeltInnerRadius = 75.0
	AsteroidBeltOuterRadius = 90.0
	AsteroidBaseDriftSpeed  = 0.003
	AsteroidMinVolume       = 0.5
	AsteroidMaxVolume       = 3.0
)

// AsteroidParams holds the calculated visual/physics parameters for a draft asteroid.
type AsteroidParams struct {
	Volume     float64 `json:"volume"`
	ColorSeed  float64 `json:"colorSeed"`  // 0=warm/new, 1=cool/old
	Roughness  float64 `json:"roughness"`  // 0=smooth(many edits), 1=rough(few edits)
	OrbitAngle float64 `json:"orbitAngle"` // radians, position in the belt ring
	DriftSpeed float64 `json:"driftSpeed"` // radians per second
}

// CalculateAsteroidParams computes visual parameters for a draft asteroid.
//   - wordCount: number of words in the draft
//   - createdAt: creation time (newer = warmer color)
//   - editCount: number of edits (more edits = smoother)
//   - seed: deterministic seed from body ID
func CalculateAsteroidParams(wordCount int, createdAt time.Time, editCount int, seed uint64) AsteroidParams {
	// Volume: linear map from word count, clamped to [0.5, 3.0]
	vol := AsteroidMinVolume + float64(wordCount)/2000.0*(AsteroidMaxVolume-AsteroidMinVolume)
	vol = math.Min(AsteroidMaxVolume, math.Max(AsteroidMinVolume, vol))

	// Color seed: 0 (brand new) to 1 (very old, > 365 days)
	ageDays := time.Since(createdAt).Hours() / 24
	colorSeed := math.Min(1.0, ageDays/365.0)

	// Roughness: more edits = smoother (closer to 0)
	roughness := 1.0
	if editCount > 0 {
		roughness = 1.0 / (1.0 + float64(editCount)*0.3)
	}

	// Orbit angle: deterministic from seed
	orbitAngle := deterministicFloat(seed, 0) * 2 * math.Pi

	// Drift speed: slight variation per asteroid
	driftSpeed := AsteroidBaseDriftSpeed * (0.8 + deterministicFloat(seed, 1)*0.4)

	return AsteroidParams{
		Volume:     vol,
		ColorSeed:  colorSeed,
		Roughness:  roughness,
		OrbitAngle: orbitAngle,
		DriftSpeed: driftSpeed,
	}
}
