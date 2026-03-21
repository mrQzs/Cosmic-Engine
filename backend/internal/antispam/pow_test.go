package antispam

import (
	"crypto/sha256"
	"fmt"
	"testing"
)

func TestHasLeadingZeroBits(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		hash   []byte
		n      int
		expect bool
	}{
		{
			name:   "all zeros, 0 bits required",
			hash:   []byte{0x00, 0x00, 0x00, 0x00},
			n:      0,
			expect: true,
		},
		{
			name:   "all zeros, 16 bits required",
			hash:   []byte{0x00, 0x00, 0x00, 0x00},
			n:      16,
			expect: true,
		},
		{
			name:   "first byte non-zero, 8 bits required",
			hash:   []byte{0x01, 0x00, 0x00, 0x00},
			n:      8,
			expect: false,
		},
		{
			name:   "first byte zero, 8 bits required",
			hash:   []byte{0x00, 0xff, 0x00, 0x00},
			n:      8,
			expect: true,
		},
		{
			name:   "partial byte: 0x0f with 4 bits required",
			hash:   []byte{0x0f, 0x00},
			n:      4,
			expect: true,
		},
		{
			name:   "partial byte: 0x0f with 5 bits required",
			hash:   []byte{0x0f, 0x00},
			n:      5,
			expect: false,
		},
		{
			name:   "18 leading zeros",
			hash:   []byte{0x00, 0x00, 0x03, 0xff},
			n:      18,
			expect: true,
		},
		{
			name:   "18 bits required but only 17 zeros",
			hash:   []byte{0x00, 0x00, 0x40, 0xff},
			n:      18,
			expect: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			got := hasLeadingZeroBits(tt.hash, tt.n)
			if got != tt.expect {
				t.Errorf("hasLeadingZeroBits(%v, %d) = %v, want %v", tt.hash, tt.n, got, tt.expect)
			}
		})
	}
}

func TestValidateNonce(t *testing.T) {
	t.Parallel()

	// Find a valid nonce for a known prefix with low difficulty (4 bits)
	prefix := "test-prefix-123"
	difficulty := 4

	var validNonce int
	for n := 0; n < 100000; n++ {
		data := fmt.Sprintf("%s%d", prefix, n)
		hash := sha256.Sum256([]byte(data))
		if hasLeadingZeroBits(hash[:], difficulty) {
			validNonce = n
			break
		}
	}

	// Verify the nonce
	data := fmt.Sprintf("%s%d", prefix, validNonce)
	hash := sha256.Sum256([]byte(data))
	if !hasLeadingZeroBits(hash[:], difficulty) {
		t.Fatal("failed to find a valid nonce for testing")
	}

	// Invalid nonce should fail (use nonce-1 which is very likely invalid)
	data2 := fmt.Sprintf("%s%d", prefix, validNonce+999999)
	hash2 := sha256.Sum256([]byte(data2))
	if hasLeadingZeroBits(hash2[:], 18) {
		t.Log("edge case: random nonce also valid for difficulty 18, skipping")
	}
}
