package physics

import "math"

// SatelliteOrbitalParams holds the calculated orbit for a comment satellite.
type SatelliteOrbitalParams struct {
	RingIndex        int     `json:"ringIndex"`
	OrbitRadius      float64 `json:"orbitRadius"`
	OrbitInclination float64 `json:"orbitInclination"`
	PhaseOffset      float64 `json:"phaseOffset"`
	Eccentricity     float64 `json:"eccentricity"`
	OrbitalSpeed     float64 `json:"orbitalSpeed"`
}

// CalculateSatelliteOrbit computes orbital parameters for a comment.
//   - commentIndex: 0-based position among all comments on this body
//   - totalComments: total number of comments (for density adjustment)
//   - seed: deterministic seed from comment ID
func CalculateSatelliteOrbit(commentIndex, totalComments int, seed uint64) SatelliteOrbitalParams {
	ringIndex := commentIndex / SatellitesPerRing
	posInRing := commentIndex % SatellitesPerRing

	// Ring spacing narrows for dense bodies
	spacing := SatelliteRingSpacing
	if totalComments > DenseRingThreshold {
		spacing = DenseRingSpacing
	}

	orbitRadius := SatelliteBaseRadius + float64(ringIndex)*spacing

	// Equatorial first ring, alternating inclination for subsequent rings
	var inclination float64
	if ringIndex > 0 {
		sign := 1.0
		if ringIndex%2 == 0 {
			sign = -1.0
		}
		inclination = sign * float64(ringIndex) * (SatelliteMaxInclination / float64(maxRings(totalComments)+1))
	}

	// Distribute phases evenly within each ring, with seed-based jitter
	phaseSpacing := 2 * math.Pi / float64(commentsInRing(commentIndex, totalComments))
	jitter := deterministicFloat(seed, 0) * phaseSpacing * 0.3
	phaseOffset := float64(posInRing)*phaseSpacing + jitter

	eccentricity := 0.02 + deterministicFloat(seed, 1)*0.13 // Range 0.02~0.15 for natural elliptical orbits

	orbitalSpeed := SatelliteKeplerK / math.Sqrt(orbitRadius*orbitRadius*orbitRadius)
	if orbitalSpeed < MinOrbitalSpeed {
		orbitalSpeed = MinOrbitalSpeed
	}

	return SatelliteOrbitalParams{
		RingIndex:        ringIndex,
		OrbitRadius:      orbitRadius,
		OrbitInclination: inclination,
		PhaseOffset:      phaseOffset,
		Eccentricity:     eccentricity,
		OrbitalSpeed:     orbitalSpeed,
	}
}

// maxRings returns the number of rings for a given total comment count.
func maxRings(total int) int {
	r := (total + SatellitesPerRing - 1) / SatellitesPerRing
	if r < 1 {
		return 1
	}
	return r
}

// commentsInRing returns how many comments are in the ring containing commentIndex.
func commentsInRing(commentIndex, totalComments int) int {
	ringIndex := commentIndex / SatellitesPerRing
	lastRing := (totalComments - 1) / SatellitesPerRing
	if ringIndex < lastRing {
		return SatellitesPerRing
	}
	remainder := totalComments % SatellitesPerRing
	if remainder == 0 {
		return SatellitesPerRing
	}
	return remainder
}
