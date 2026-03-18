-- name: ListActiveFriendLinks :many
SELECT * FROM friend_links WHERE is_active = true ORDER BY sort_order, name;

-- name: GetFriendLinkByID :one
SELECT * FROM friend_links WHERE id = $1;

-- name: CreateFriendLink :one
INSERT INTO friend_links (id, name, url, description, icon_seed, sort_order, is_active)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: UpdateFriendLink :one
UPDATE friend_links
SET name = COALESCE(sqlc.narg('name'), name),
    url = COALESCE(sqlc.narg('url'), url),
    description = COALESCE(sqlc.narg('description'), description),
    icon_seed = COALESCE(sqlc.narg('icon_seed'), icon_seed),
    sort_order = COALESCE(sqlc.narg('sort_order'), sort_order)
WHERE id = $1
RETURNING *;

-- name: DeleteFriendLink :exec
DELETE FROM friend_links WHERE id = $1;
