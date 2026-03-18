package model

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"time"

	"github.com/99designs/gqlgen/graphql"
)

// DateTime scalar — ISO 8601 ↔ time.Time
type DateTime struct {
	time.Time
}

func MarshalDateTime(t DateTime) graphql.Marshaler {
	return graphql.WriterFunc(func(w io.Writer) {
		b, _ := json.Marshal(t.Format(time.RFC3339))
		_, _ = w.Write(b)
	})
}

func UnmarshalDateTime(v interface{}) (DateTime, error) {
	switch v := v.(type) {
	case string:
		t, err := time.Parse(time.RFC3339, v)
		if err != nil {
			return DateTime{}, fmt.Errorf("DateTime must be RFC3339: %w", err)
		}
		return DateTime{t}, nil
	default:
		return DateTime{}, fmt.Errorf("DateTime must be a string")
	}
}

// JSON scalar — arbitrary JSON value
type JSON map[string]interface{}

func MarshalJSON(j JSON) graphql.Marshaler {
	return graphql.WriterFunc(func(w io.Writer) {
		b, _ := json.Marshal(j)
		_, _ = w.Write(b)
	})
}

func UnmarshalJSON(v interface{}) (JSON, error) {
	switch v := v.(type) {
	case map[string]interface{}:
		return JSON(v), nil
	case string:
		var j JSON
		if err := json.Unmarshal([]byte(v), &j); err != nil {
			return nil, fmt.Errorf("JSON scalar: invalid JSON string: %w", err)
		}
		return j, nil
	default:
		return nil, fmt.Errorf("JSON scalar: unsupported type %T", v)
	}
}

// Base64 scalar — base64-encoded []byte
type Base64 []byte

func MarshalBase64(b Base64) graphql.Marshaler {
	return graphql.WriterFunc(func(w io.Writer) {
		s := base64.StdEncoding.EncodeToString(b)
		enc, _ := json.Marshal(s)
		_, _ = w.Write(enc)
	})
}

func UnmarshalBase64(v interface{}) (Base64, error) {
	switch v := v.(type) {
	case string:
		b, err := base64.StdEncoding.DecodeString(v)
		if err != nil {
			return nil, fmt.Errorf("Base64 scalar: invalid base64: %w", err)
		}
		return Base64(b), nil
	default:
		return nil, fmt.Errorf("Base64 scalar: unsupported type %T", v)
	}
}
