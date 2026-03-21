package antispam

import (
	"testing"
)

func TestSimHash(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		textA    string
		textB    string
		similar  bool // Expect Hamming distance < 10 if similar
	}{
		{
			name:    "identical texts",
			textA:   "the quick brown fox jumps over the lazy dog",
			textB:   "the quick brown fox jumps over the lazy dog",
			similar: true,
		},
		{
			name:    "very different texts",
			textA:   "the quick brown fox jumps over the lazy dog",
			textB:   "buy cheap viagra online now free discount offer",
			similar: false,
		},
		{
			name:    "similar texts with minor changes",
			textA:   "the quick brown fox jumps over the lazy dog",
			textB:   "a quick brown fox jumped over the lazy dogs",
			similar: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			hashA := SimHash(tt.textA)
			hashB := SimHash(tt.textB)
			dist := SimHashDistance(hashA, hashB)

			if tt.similar && dist > 15 {
				t.Errorf("Expected similar texts to have distance < 15, got %d", dist)
			}
			if !tt.similar && dist < 5 {
				t.Errorf("Expected different texts to have distance >= 5, got %d", dist)
			}
		})
	}
}

func TestCheckBlacklistedURLs(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		content string
		wantErr bool
	}{
		{
			name:    "clean content",
			content: "This is a great article!",
			wantErr: false,
		},
		{
			name:    "contains blacklisted domain",
			content: "Check out this link: bit.ly/spam-link",
			wantErr: true,
		},
		{
			name:    "contains tinyurl",
			content: "Visit tinyurl.com/foo for details",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			err := checkBlacklistedURLs(tt.content)
			if (err != nil) != tt.wantErr {
				t.Errorf("checkBlacklistedURLs() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateBehavior(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		score   float64
		wantErr bool
	}{
		{"high score passes", 0.8, false},
		{"medium score passes", 0.3, false},
		{"borderline passes", 0.2, false},
		{"low score fails", 0.1, true},
		{"zero fails", 0.0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			err := ValidateBehavior(tt.score)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateBehavior(%f) error = %v, wantErr %v", tt.score, err, tt.wantErr)
			}
		})
	}
}
