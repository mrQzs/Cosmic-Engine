-- name: LinkBodyTag :exec
INSERT INTO body_tags (body_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;

-- name: UnlinkBodyTag :exec
DELETE FROM body_tags WHERE body_id = $1 AND tag_id = $2;

-- name: UnlinkAllBodyTags :exec
DELETE FROM body_tags WHERE body_id = $1;
