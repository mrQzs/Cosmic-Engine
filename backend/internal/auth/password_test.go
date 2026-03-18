package auth

import (
	"strings"
	"testing"
)

func TestHashPassword(t *testing.T) {
	t.Parallel()

	hash, err := HashPassword("test-password-123")
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	if !strings.HasPrefix(hash, "$argon2id$") {
		t.Errorf("hash should start with $argon2id$, got: %s", hash[:20])
	}

	parts := strings.Split(hash, "$")
	if len(parts) != 6 {
		t.Errorf("hash should have 6 parts, got %d", len(parts))
	}
}

func TestHashPassword_UniqueSalts(t *testing.T) {
	t.Parallel()

	h1, _ := HashPassword("same-password")
	h2, _ := HashPassword("same-password")

	if h1 == h2 {
		t.Error("two hashes of the same password should differ (unique salts)")
	}
}

func TestVerifyPassword(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		password string
		wantOK   bool
	}{
		{"correct password", "my-secret-pw", true},
		{"wrong password", "wrong-pw", false},
		{"empty password", "", false},
	}

	hash, err := HashPassword("my-secret-pw")
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			ok, err := VerifyPassword(tt.password, hash)
			if err != nil {
				t.Fatalf("VerifyPassword error: %v", err)
			}
			if ok != tt.wantOK {
				t.Errorf("VerifyPassword(%q) = %v, want %v", tt.password, ok, tt.wantOK)
			}
		})
	}
}

func TestVerifyPassword_InvalidHash(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		hash string
	}{
		{"empty string", ""},
		{"random string", "not-a-hash"},
		{"too few parts", "$argon2id$v=19$m=65536"},
		{"bad base64 salt", "$argon2id$v=19$m=65536,t=3,p=4$!!!$aaa"},
		{"bad base64 hash", "$argon2id$v=19$m=65536,t=3,p=4$aaa$!!!"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			_, err := VerifyPassword("password", tt.hash)
			if err == nil {
				t.Error("expected error for invalid hash")
			}
		})
	}
}

func BenchmarkHashPassword(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_, _ = HashPassword("benchmark-password")
	}
}

func BenchmarkVerifyPassword(b *testing.B) {
	hash, _ := HashPassword("benchmark-password")
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = VerifyPassword("benchmark-password", hash)
	}
}
