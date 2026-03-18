-- name: AddReaction :one
INSERT INTO reactions (id, target_type, target_id, emoji, session_hash)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (target_type, target_id, emoji, session_hash) DO NOTHING
RETURNING *;

-- name: ListReactionsByTarget :many
SELECT emoji, count(*)::int as count
FROM reactions
WHERE target_type = $1 AND target_id = $2
GROUP BY emoji
ORDER BY count DESC;
