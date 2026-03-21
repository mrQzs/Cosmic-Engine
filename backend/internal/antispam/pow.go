package antispam

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	// PowDifficulty is the number of leading zero bits required.
	PowDifficulty = 18

	// PowTTL is how long a challenge remains valid.
	PowTTL = 5 * time.Minute

	powKeyPrefix = "pow:challenge:"
)

// PowService handles PoW challenge generation and verification.
type PowService struct {
	redis *redis.Client
}

// NewPowService creates a PoW service backed by Redis.
// If redis is nil, validation is skipped (dev mode).
func NewPowService(redis *redis.Client) *PowService {
	return &PowService{redis: redis}
}

// Challenge represents a PoW challenge returned to the client.
type Challenge struct {
	ChallengeID string
	Prefix      string
	Difficulty  int
	ExpiresAt   time.Time
}

// GenerateChallenge creates a new PoW challenge and stores it in Redis.
func (s *PowService) GenerateChallenge(ctx context.Context) (*Challenge, error) {
	// Generate random prefix (16 bytes → 32 hex chars)
	prefixBytes := make([]byte, 16)
	if _, err := rand.Read(prefixBytes); err != nil {
		return nil, fmt.Errorf("generate random prefix: %w", err)
	}
	prefix := hex.EncodeToString(prefixBytes)

	// Generate challenge ID
	idBytes := make([]byte, 8)
	if _, err := rand.Read(idBytes); err != nil {
		return nil, fmt.Errorf("generate challenge id: %w", err)
	}
	challengeID := fmt.Sprintf("pow-%s", hex.EncodeToString(idBytes))

	expiresAt := time.Now().Add(PowTTL)

	// Store in Redis if available
	if s.redis != nil {
		key := powKeyPrefix + challengeID
		if err := s.redis.Set(ctx, key, prefix, PowTTL).Err(); err != nil {
			return nil, fmt.Errorf("store pow challenge: %w", err)
		}
	}

	return &Challenge{
		ChallengeID: challengeID,
		Prefix:      prefix,
		Difficulty:  PowDifficulty,
		ExpiresAt:   expiresAt,
	}, nil
}

// Validate checks that the nonce satisfies the PoW challenge.
// Returns nil on success, error on failure.
func (s *PowService) Validate(ctx context.Context, challengeID string, nonce int) error {
	// Dev mode: skip validation if no Redis
	if s.redis == nil {
		return nil
	}

	key := powKeyPrefix + challengeID
	prefix, err := s.redis.GetDel(ctx, key).Result()
	if err != nil {
		return fmt.Errorf("invalid or expired challenge")
	}

	// Verify: SHA256(prefix + nonce) must have PowDifficulty leading zero bits
	data := fmt.Sprintf("%s%d", prefix, nonce)
	hash := sha256.Sum256([]byte(data))

	if !hasLeadingZeroBits(hash[:], PowDifficulty) {
		return fmt.Errorf("invalid proof of work")
	}

	return nil
}

// hasLeadingZeroBits checks if the hash has at least n leading zero bits.
func hasLeadingZeroBits(hash []byte, n int) bool {
	fullBytes := n / 8
	remainBits := n % 8

	for i := 0; i < fullBytes; i++ {
		if hash[i] != 0 {
			return false
		}
	}

	if remainBits > 0 {
		mask := byte(0xFF << (8 - remainBits))
		if hash[fullBytes]&mask != 0 {
			return false
		}
	}

	return true
}
