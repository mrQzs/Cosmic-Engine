-- name: CreateUpload :one
INSERT INTO uploads (id, filename, original_name, mime_type, size, storage_type, storage_path, cdn_url, width, height, blurhash, uploader_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING *;

-- name: ListUploads :many
SELECT * FROM uploads ORDER BY created_at DESC LIMIT $1 OFFSET $2;

-- name: DeleteUpload :exec
DELETE FROM uploads WHERE id = $1;
