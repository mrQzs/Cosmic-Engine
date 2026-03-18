package validator

import (
	"errors"
	"testing"

	apperr "cosmic-engine/backend/internal/errors"
)

type testInput struct {
	Name  string `validate:"required,min=2"`
	Email string `validate:"required,email"`
	Age   int    `validate:"gte=0,lte=150"`
}

func TestStruct_Valid(t *testing.T) {
	t.Parallel()

	input := testInput{Name: "Alice", Email: "alice@example.com", Age: 25}
	if err := Struct(input); err != nil {
		t.Errorf("valid input should pass: %v", err)
	}
}

func TestStruct_Invalid(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		input testInput
	}{
		{"missing name", testInput{Email: "a@b.com", Age: 20}},
		{"name too short", testInput{Name: "A", Email: "a@b.com", Age: 20}},
		{"invalid email", testInput{Name: "Alice", Email: "not-email", Age: 20}},
		{"negative age", testInput{Name: "Alice", Email: "a@b.com", Age: -1}},
		{"age over limit", testInput{Name: "Alice", Email: "a@b.com", Age: 200}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			err := Struct(tt.input)
			if err == nil {
				t.Fatal("expected validation error")
			}

			var appErr *apperr.AppError
			if !errors.As(err, &appErr) {
				t.Fatal("error should be *AppError")
			}
			if appErr.Code != apperr.CodeValidation {
				t.Errorf("code = %d, want %d", appErr.Code, apperr.CodeValidation)
			}
			if appErr.Detail == "" {
				t.Error("Detail should contain field info")
			}
		})
	}
}
