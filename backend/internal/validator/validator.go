package validator

import (
	"errors"
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"

	apperr "cosmic-engine/backend/internal/errors"
)

var validate = validator.New()

func Struct(s interface{}) error {
	if err := validate.Struct(s); err != nil {
		var ve validator.ValidationErrors
		if ok := errors.As(err, &ve); ok {
			msgs := make([]string, 0, len(ve))
			for _, fe := range ve {
				msgs = append(msgs, fmt.Sprintf("field '%s' failed on '%s'", fe.Field(), fe.Tag()))
			}
			return &apperr.AppError{
				Code:    apperr.CodeValidation,
				Message: "Validation failed",
				Detail:  strings.Join(msgs, "; "),
			}
		}
		return &apperr.AppError{
			Code:    apperr.CodeValidation,
			Message: "Validation error",
		}
	}
	return nil
}
