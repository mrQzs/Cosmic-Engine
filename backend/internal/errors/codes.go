package errors

import "fmt"

// Error codes follow the pattern: HTTP_STATUS * 100 + sequence
const (
	CodeBadRequest       = 40000
	CodeValidation       = 40001
	CodeInvalidInput     = 40002
	CodeUnauthorized     = 40100
	CodeTokenExpired     = 40101
	CodeTokenInvalid     = 40102
	CodeForbidden        = 40300
	CodeNotFound         = 40400
	CodeConflict         = 40900
	CodeRateLimited      = 42900
	CodeInternal         = 50000
	CodeDatabaseError    = 50001
	CodeCacheError       = 50002
	CodeExternalService  = 50003
)

type AppError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Detail  string `json:"detail,omitempty"`
	Err     error  `json:"-"`
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%d] %s: %v", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

func (e *AppError) HTTPStatus() int {
	return e.Code / 100
}

func NewBadRequest(msg string) *AppError {
	return &AppError{Code: CodeBadRequest, Message: msg}
}

func NewValidation(msg string) *AppError {
	return &AppError{Code: CodeValidation, Message: msg}
}

func NewUnauthorized(msg string) *AppError {
	return &AppError{Code: CodeUnauthorized, Message: msg}
}

func NewForbidden(msg string) *AppError {
	return &AppError{Code: CodeForbidden, Message: msg}
}

func NewNotFound(msg string) *AppError {
	return &AppError{Code: CodeNotFound, Message: msg}
}

func NewConflict(msg string) *AppError {
	return &AppError{Code: CodeConflict, Message: msg}
}

func NewRateLimited() *AppError {
	return &AppError{Code: CodeRateLimited, Message: "Too many requests"}
}

func NewInternal(msg string, err error) *AppError {
	return &AppError{Code: CodeInternal, Message: msg, Err: err}
}
