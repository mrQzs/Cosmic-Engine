package config

import (
	"os"
	"testing"
)

func TestLoad_Defaults(t *testing.T) {
	// Don't run parallel — mutates env
	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load: %v", err)
	}

	if cfg.Server.Port != "4000" {
		t.Errorf("Port = %q, want %q", cfg.Server.Port, "4000")
	}
	if cfg.Server.Host != "0.0.0.0" {
		t.Errorf("Host = %q, want %q", cfg.Server.Host, "0.0.0.0")
	}
	if cfg.Database.MaxConns != 25 {
		t.Errorf("MaxConns = %d, want 25", cfg.Database.MaxConns)
	}
	if cfg.Database.MinConns != 5 {
		t.Errorf("MinConns = %d, want 5", cfg.Database.MinConns)
	}
	if cfg.Auth.JWTExpireHrs != 24 {
		t.Errorf("JWTExpireHrs = %d, want 24", cfg.Auth.JWTExpireHrs)
	}
	if len(cfg.CORS.Origins) == 0 {
		t.Error("CORS.Origins should not be empty")
	}
}

func TestLoad_EnvOverride(t *testing.T) {
	os.Setenv("PORT", "9999")
	os.Setenv("JWT_SECRET", "my-secret")
	os.Setenv("CORS_ORIGINS", "http://a.com, http://b.com")
	defer func() {
		os.Unsetenv("PORT")
		os.Unsetenv("JWT_SECRET")
		os.Unsetenv("CORS_ORIGINS")
	}()

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load: %v", err)
	}

	if cfg.Server.Port != "9999" {
		t.Errorf("Port = %q, want %q", cfg.Server.Port, "9999")
	}
	if cfg.Auth.JWTSecret != "my-secret" {
		t.Errorf("JWTSecret = %q, want %q", cfg.Auth.JWTSecret, "my-secret")
	}
	if len(cfg.CORS.Origins) != 2 {
		t.Fatalf("CORS.Origins len = %d, want 2", len(cfg.CORS.Origins))
	}
	if cfg.CORS.Origins[0] != "http://a.com" {
		t.Errorf("Origins[0] = %q, want %q", cfg.CORS.Origins[0], "http://a.com")
	}
	if cfg.CORS.Origins[1] != "http://b.com" {
		t.Errorf("Origins[1] = %q, want %q", cfg.CORS.Origins[1], "http://b.com")
	}
}
