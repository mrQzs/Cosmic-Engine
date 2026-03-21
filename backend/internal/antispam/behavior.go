package antispam

import "fmt"

const (
	// MinBehaviorScore is the minimum acceptable behavior score.
	// Bots have very low entropy (perfect straight mouse, uniform keystroke timing).
	MinBehaviorScore = 0.2
)

// ValidateBehavior checks the frontend-computed behavior score.
// Score ranges from 0 (definitely bot) to 1 (definitely human).
func ValidateBehavior(score float64) error {
	if score < MinBehaviorScore {
		return fmt.Errorf("behavior score too low: %.2f (min: %.2f)", score, MinBehaviorScore)
	}
	return nil
}
