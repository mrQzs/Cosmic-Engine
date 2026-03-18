package auth

import (
	"testing"
	"time"
)

func TestGenerateAndValidateToken(t *testing.T) {
	t.Parallel()

	secret := "test-secret-key-for-jwt"
	token, expiresAt, err := GenerateToken(secret, "user-123", "test@example.com", "admin", 24)
	if err != nil {
		t.Fatalf("GenerateToken: %v", err)
	}

	if token == "" {
		t.Fatal("token should not be empty")
	}
	if expiresAt.Before(time.Now()) {
		t.Error("expiresAt should be in the future")
	}

	claims, err := ValidateToken(secret, token)
	if err != nil {
		t.Fatalf("ValidateToken: %v", err)
	}

	if claims.UserID != "user-123" {
		t.Errorf("UserID = %q, want %q", claims.UserID, "user-123")
	}
	if claims.Email != "test@example.com" {
		t.Errorf("Email = %q, want %q", claims.Email, "test@example.com")
	}
	if claims.Role != "admin" {
		t.Errorf("Role = %q, want %q", claims.Role, "admin")
	}
	if claims.Issuer != "cybergeek" {
		t.Errorf("Issuer = %q, want %q", claims.Issuer, "cybergeek")
	}
}

func TestValidateToken_WrongSecret(t *testing.T) {
	t.Parallel()

	token, _, _ := GenerateToken("secret-1", "user-1", "a@b.com", "admin", 1)
	_, err := ValidateToken("secret-2", token)
	if err == nil {
		t.Error("expected error with wrong secret")
	}
}

func TestValidateToken_MalformedToken(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		token string
	}{
		{"empty", ""},
		{"garbage", "not.a.jwt"},
		{"truncated", "eyJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiIxIn0"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			_, err := ValidateToken("secret", tt.token)
			if err == nil {
				t.Error("expected error for malformed token")
			}
		})
	}
}

func TestGenerateToken_DifferentExpiry(t *testing.T) {
	t.Parallel()

	_, exp1, _ := GenerateToken("s", "u", "e", "r", 1)
	_, exp24, _ := GenerateToken("s", "u", "e", "r", 24)

	diff := exp24.Sub(exp1)
	if diff < 22*time.Hour || diff > 24*time.Hour {
		t.Errorf("24h token should expire ~23h after 1h token, got %v", diff)
	}
}
