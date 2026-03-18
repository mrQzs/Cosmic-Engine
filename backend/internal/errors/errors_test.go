package errors

import (
	"errors"
	"testing"
)

func TestAppError_Error(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		err     *AppError
		wantStr string
	}{
		{
			"without wrapped error",
			&AppError{Code: CodeBadRequest, Message: "bad input"},
			"[40000] bad input",
		},
		{
			"with wrapped error",
			&AppError{Code: CodeInternal, Message: "db failed", Err: errors.New("connection refused")},
			"[50000] db failed: connection refused",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			if got := tt.err.Error(); got != tt.wantStr {
				t.Errorf("Error() = %q, want %q", got, tt.wantStr)
			}
		})
	}
}

func TestAppError_HTTPStatus(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		code   int
		status int
	}{
		{"bad request", CodeBadRequest, 400},
		{"validation", CodeValidation, 400},
		{"unauthorized", CodeUnauthorized, 401},
		{"token expired", CodeTokenExpired, 401},
		{"forbidden", CodeForbidden, 403},
		{"not found", CodeNotFound, 404},
		{"conflict", CodeConflict, 409},
		{"rate limited", CodeRateLimited, 429},
		{"internal", CodeInternal, 500},
		{"database error", CodeDatabaseError, 500},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			err := &AppError{Code: tt.code, Message: "test"}
			if got := err.HTTPStatus(); got != tt.status {
				t.Errorf("code %d → HTTPStatus() = %d, want %d", tt.code, got, tt.status)
			}
		})
	}
}

func TestAppError_Unwrap(t *testing.T) {
	t.Parallel()

	inner := errors.New("inner error")
	appErr := NewInternal("wrapper", inner)

	if !errors.Is(appErr, inner) {
		t.Error("errors.Is should find the inner error")
	}

	var target *AppError
	if !errors.As(appErr, &target) {
		t.Error("errors.As should match *AppError")
	}
	if target.Code != CodeInternal {
		t.Errorf("Code = %d, want %d", target.Code, CodeInternal)
	}
}

func TestConstructors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		err      *AppError
		wantCode int
	}{
		{"NewBadRequest", NewBadRequest("x"), CodeBadRequest},
		{"NewValidation", NewValidation("x"), CodeValidation},
		{"NewUnauthorized", NewUnauthorized("x"), CodeUnauthorized},
		{"NewForbidden", NewForbidden("x"), CodeForbidden},
		{"NewNotFound", NewNotFound("x"), CodeNotFound},
		{"NewConflict", NewConflict("x"), CodeConflict},
		{"NewRateLimited", NewRateLimited(), CodeRateLimited},
		{"NewInternal", NewInternal("x", nil), CodeInternal},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			if tt.err.Code != tt.wantCode {
				t.Errorf("Code = %d, want %d", tt.err.Code, tt.wantCode)
			}
		})
	}
}
