-- name: CreateSubscriber :one
INSERT INTO subscribers (id, email, frequency, confirm_token, unsubscribe_token)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ConfirmSubscriber :exec
UPDATE subscribers SET confirmed = true, confirm_token = NULL WHERE confirm_token = $1;

-- name: Unsubscribe :exec
UPDATE subscribers SET confirmed = false WHERE unsubscribe_token = $1;
