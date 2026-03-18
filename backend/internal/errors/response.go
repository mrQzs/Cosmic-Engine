package errors

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"
)

type SuccessResponse struct {
	Data interface{} `json:"data"`
}

type ErrorResponse struct {
	Error ErrorBody `json:"error"`
}

type ErrorBody struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Detail  string `json:"detail,omitempty"`
}

func SendSuccess(c *fiber.Ctx, data interface{}) error {
	return c.JSON(SuccessResponse{Data: data})
}

func SendError(c *fiber.Ctx, err error) error {
	var appErr *AppError
	if errors.As(err, &appErr) {
		status := appErr.HTTPStatus()
		if status >= 500 {
			log.Error().Err(appErr.Err).Int("code", appErr.Code).Msg(appErr.Message)
		}
		return c.Status(status).JSON(ErrorResponse{
			Error: ErrorBody{
				Code:    appErr.Code,
				Message: appErr.Message,
				Detail:  appErr.Detail,
			},
		})
	}

	// Unknown errors become 500
	log.Error().Err(err).Msg("unhandled error")
	return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{
		Error: ErrorBody{
			Code:    CodeInternal,
			Message: "Internal Server Error",
		},
	})
}

// FiberErrorHandler is the global Fiber error handler.
func FiberErrorHandler(c *fiber.Ctx, err error) error {
	var fe *fiber.Error
	if errors.As(err, &fe) {
		return c.Status(fe.Code).JSON(ErrorResponse{
			Error: ErrorBody{
				Code:    fe.Code * 100,
				Message: fe.Message,
			},
		})
	}
	return SendError(c, err)
}
