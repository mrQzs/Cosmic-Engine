package physics

import "math"

// Orbital constants — must match shared/src/constants/physics.ts
const (
	// Planet orbit parameters
	BaseOrbitRadius  = 8.0  // Base orbit radius for the first planet
	OrbitSpacing     = 4.0  // Distance between adjacent orbits
	OrbitJitterMax   = 0.5  // Max deterministic jitter per orbit
	KeplerConstant   = 2.0  // K for orbital speed: K / sqrt(r^3)
	MinOrbitalSpeed  = 0.05 // Floor for orbital speed
	MaxEccentricity  = 0.15 // Cap for orbit eccentricity

	// Planet mass from word count
	MassBaseOffset = 1.0
	MassLogFactor  = 0.5

	// Satellite (comment) orbit parameters
	SatelliteBaseRadius   = 2.0  // Inner ring radius (from planet center)
	SatelliteRingSpacing  = 0.5  // Gap between rings
	SatellitesPerRing     = 8    // Comments per ring before adding new ring
	SatelliteKeplerK      = 0.8  // Kepler constant for satellite speed
	SatelliteMaxInclination = math.Pi / 6 // 30° max inclination
	DenseRingThreshold    = 50   // After this many comments, ring spacing narrows

	// Narrowed ring spacing for dense mode (>50 comments)
	DenseRingSpacing = 0.2
)
