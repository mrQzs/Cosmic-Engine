-- name: GetUserByEmail :one
SELECT id, display_name, email, password_hash, avatar_url, role, totp_secret, totp_enabled, created_at, updated_at
FROM users
WHERE email = $1;

-- name: GetUserByID :one
SELECT id, display_name, email, password_hash, avatar_url, role, totp_secret, totp_enabled, created_at, updated_at
FROM users
WHERE id = $1;

-- name: CreateUser :one
INSERT INTO users (id, display_name, email, password_hash, avatar_url, role)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateUser :one
UPDATE users
SET display_name = COALESCE(sqlc.narg('display_name'), display_name),
    avatar_url = COALESCE(sqlc.narg('avatar_url'), avatar_url)
WHERE id = $1
RETURNING *;
