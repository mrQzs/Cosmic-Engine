-- name: ListSiteSettings :many
SELECT * FROM site_settings ORDER BY key;

-- name: GetSiteSetting :one
SELECT * FROM site_settings WHERE key = $1;

-- name: UpsertSiteSetting :one
INSERT INTO site_settings (key, value)
VALUES ($1, $2)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
RETURNING *;
