package config

import (
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	Auth     AuthConfig
	CORS     CORSConfig
}

type ServerConfig struct {
	Port string `mapstructure:"PORT"`
	Host string `mapstructure:"SERVER_HOST"`
}

type DatabaseConfig struct {
	URL      string `mapstructure:"DATABASE_URL"`
	MaxConns int    `mapstructure:"DB_MAX_CONNS"`
	MinConns int    `mapstructure:"DB_MIN_CONNS"`
}

type RedisConfig struct {
	URL string `mapstructure:"REDIS_URL"`
}

type AuthConfig struct {
	JWTSecret    string `mapstructure:"JWT_SECRET"`
	JWTExpireHrs int    `mapstructure:"JWT_EXPIRE_HOURS"`
}

type CORSConfig struct {
	Origins []string
}

func Load() (*Config, error) {
	v := viper.New()

	v.SetConfigFile(".env")
	v.AddConfigPath(".")
	v.AddConfigPath("..")
	v.AutomaticEnv()

	// Defaults
	v.SetDefault("PORT", "4000")
	v.SetDefault("SERVER_HOST", "0.0.0.0")
	v.SetDefault("DATABASE_URL", "postgres://cybergeek:password@localhost:5432/cybergeek?sslmode=disable")
	v.SetDefault("REDIS_URL", "redis://localhost:6379/0")
	v.SetDefault("JWT_SECRET", "change-me-in-production")
	v.SetDefault("JWT_EXPIRE_HOURS", 24)
	v.SetDefault("CORS_ORIGINS", "http://localhost:3000")
	v.SetDefault("DB_MAX_CONNS", 25)
	v.SetDefault("DB_MIN_CONNS", 5)

	// Ignore missing .env file
	_ = v.ReadInConfig()

	cfg := &Config{}
	cfg.Server.Port = v.GetString("PORT")
	cfg.Server.Host = v.GetString("SERVER_HOST")
	cfg.Database.URL = v.GetString("DATABASE_URL")
	cfg.Database.MaxConns = v.GetInt("DB_MAX_CONNS")
	cfg.Database.MinConns = v.GetInt("DB_MIN_CONNS")
	cfg.Redis.URL = v.GetString("REDIS_URL")
	cfg.Auth.JWTSecret = v.GetString("JWT_SECRET")
	cfg.Auth.JWTExpireHrs = v.GetInt("JWT_EXPIRE_HOURS")

	origins := v.GetString("CORS_ORIGINS")
	cfg.CORS.Origins = strings.Split(origins, ",")
	for i := range cfg.CORS.Origins {
		cfg.CORS.Origins[i] = strings.TrimSpace(cfg.CORS.Origins[i])
	}

	return cfg, nil
}
