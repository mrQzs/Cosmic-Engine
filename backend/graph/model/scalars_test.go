package model

import (
	"bytes"
	"testing"
	"time"
)

func TestMarshalDateTime(t *testing.T) {
	t.Parallel()

	dt := DateTime{Time: time.Date(2024, 3, 15, 14, 30, 0, 0, time.UTC)}
	m := MarshalDateTime(dt)

	var buf bytes.Buffer
	m.MarshalGQL(&buf)

	got := buf.String()
	want := `"2024-03-15T14:30:00Z"`
	if got != want {
		t.Errorf("MarshalDateTime = %s, want %s", got, want)
	}
}

func TestUnmarshalDateTime_Valid(t *testing.T) {
	t.Parallel()

	dt, err := UnmarshalDateTime("2024-06-15T10:00:00Z")
	if err != nil {
		t.Fatalf("UnmarshalDateTime: %v", err)
	}

	if dt.Year() != 2024 || dt.Month() != 6 || dt.Day() != 15 {
		t.Errorf("date = %v, want 2024-06-15", dt.Time)
	}
}

func TestUnmarshalDateTime_Invalid(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		input interface{}
	}{
		{"not a string", 12345},
		{"bad format", "not-a-date"},
		{"partial date", "2024-06-15"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			_, err := UnmarshalDateTime(tt.input)
			if err == nil {
				t.Error("expected error")
			}
		})
	}
}

func TestMarshalJSON_Scalar(t *testing.T) {
	t.Parallel()

	j := JSON{"key": "value", "num": float64(42)}
	m := MarshalJSON(j)

	var buf bytes.Buffer
	m.MarshalGQL(&buf)

	got := buf.String()
	// JSON output order is non-deterministic, just check it contains the data
	if !bytes.Contains(buf.Bytes(), []byte(`"key"`)) {
		t.Errorf("JSON marshal missing key: %s", got)
	}
}

func TestUnmarshalJSON_Map(t *testing.T) {
	t.Parallel()

	input := map[string]interface{}{"a": "b"}
	j, err := UnmarshalJSON(input)
	if err != nil {
		t.Fatalf("UnmarshalJSON: %v", err)
	}
	if j["a"] != "b" {
		t.Errorf(`j["a"] = %v, want "b"`, j["a"])
	}
}

func TestUnmarshalJSON_Invalid(t *testing.T) {
	t.Parallel()

	_, err := UnmarshalJSON(12345)
	if err == nil {
		t.Error("expected error for int input")
	}
}

func TestMarshalBase64(t *testing.T) {
	t.Parallel()

	b := Base64([]byte("hello world"))
	m := MarshalBase64(b)

	var buf bytes.Buffer
	m.MarshalGQL(&buf)

	// "aGVsbG8gd29ybGQ=" is base64 of "hello world"
	if !bytes.Contains(buf.Bytes(), []byte("aGVsbG8gd29ybGQ=")) {
		t.Errorf("unexpected base64: %s", buf.String())
	}
}

func TestUnmarshalBase64_Valid(t *testing.T) {
	t.Parallel()

	b, err := UnmarshalBase64("aGVsbG8=")
	if err != nil {
		t.Fatalf("UnmarshalBase64: %v", err)
	}
	if string(b) != "hello" {
		t.Errorf("decoded = %q, want %q", string(b), "hello")
	}
}

func TestUnmarshalBase64_Invalid(t *testing.T) {
	t.Parallel()

	_, err := UnmarshalBase64("!!!not-base64!!!")
	if err == nil {
		t.Error("expected error for invalid base64")
	}

	_, err = UnmarshalBase64(12345)
	if err == nil {
		t.Error("expected error for non-string input")
	}
}
