package middleware

import (
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestRequestID_GeneratesUUID(t *testing.T) {
	t.Parallel()

	app := fiber.New()
	app.Use(RequestID())
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("ok")
	})

	req := httptest.NewRequest("GET", "/", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}

	rid := resp.Header.Get(HeaderRequestID)
	if rid == "" {
		t.Error("X-Request-ID header should be set")
	}
	if len(rid) < 32 {
		t.Errorf("request ID too short: %q", rid)
	}
}

func TestRequestID_PreservesExisting(t *testing.T) {
	t.Parallel()

	app := fiber.New()
	app.Use(RequestID())
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("ok")
	})

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set(HeaderRequestID, "my-custom-id")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}

	rid := resp.Header.Get(HeaderRequestID)
	if rid != "my-custom-id" {
		t.Errorf("should preserve existing ID, got %q", rid)
	}
}

func TestRecovery_CatchesPanic(t *testing.T) {
	t.Parallel()

	app := fiber.New()
	app.Use(Recovery())
	app.Get("/panic", func(c *fiber.Ctx) error {
		panic("test panic")
	})

	req := httptest.NewRequest("GET", "/panic", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}

	if resp.StatusCode != 500 {
		t.Errorf("status = %d, want 500", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	if len(body) == 0 {
		t.Error("response body should contain error JSON")
	}
}
