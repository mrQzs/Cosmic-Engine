package antispam

import (
	"crypto/md5"
	"fmt"
	"strings"
)

// URLBlacklist is a configurable list of spam domains.
var URLBlacklist = map[string]bool{
	"bit.ly":     true,
	"tinyurl.com": true,
}

// ValidateContent performs basic content analysis to detect spam.
// Returns nil if content passes all checks.
func ValidateContent(commentContent, articleContent string) error {
	if err := checkRelevance(commentContent, articleContent); err != nil {
		return err
	}
	if err := checkBlacklistedURLs(commentContent); err != nil {
		return err
	}
	return nil
}

// SimHash computes a 64-bit SimHash fingerprint for deduplication.
func SimHash(text string) uint64 {
	words := strings.Fields(strings.ToLower(text))
	var v [64]int

	for _, word := range words {
		h := md5.Sum([]byte(word))
		var hash uint64
		for i := 0; i < 8; i++ {
			hash |= uint64(h[i]) << (uint(i) * 8)
		}
		for i := 0; i < 64; i++ {
			if hash&(1<<uint(i)) != 0 {
				v[i]++
			} else {
				v[i]--
			}
		}
	}

	var fingerprint uint64
	for i := 0; i < 64; i++ {
		if v[i] > 0 {
			fingerprint |= 1 << uint(i)
		}
	}
	return fingerprint
}

// SimHashDistance returns the Hamming distance between two SimHash fingerprints.
func SimHashDistance(a, b uint64) int {
	x := a ^ b
	count := 0
	for x != 0 {
		count++
		x &= x - 1
	}
	return count
}

// checkRelevance computes TF-IDF overlap between comment and article.
// Very low relevance suggests the comment is unrelated spam.
func checkRelevance(comment, article string) error {
	if len(article) == 0 {
		return nil // Can't check relevance without article content
	}

	commentWords := wordSet(comment)
	articleWords := wordSet(article)

	if len(commentWords) == 0 {
		return fmt.Errorf("comment content is empty")
	}

	// Simple Jaccard similarity
	intersection := 0
	for w := range commentWords {
		if articleWords[w] {
			intersection++
		}
	}

	union := len(commentWords) + len(articleWords) - intersection
	if union == 0 {
		return nil
	}

	similarity := float64(intersection) / float64(union)

	// Very short comments (< 5 words) are exempt from relevance check
	if len(commentWords) < 5 {
		return nil
	}

	// Threshold: at least 2% word overlap for longer comments
	if similarity < 0.02 && len(commentWords) >= 10 {
		return fmt.Errorf("comment appears unrelated to article (similarity: %.4f)", similarity)
	}

	return nil
}

func checkBlacklistedURLs(content string) error {
	lower := strings.ToLower(content)
	for domain := range URLBlacklist {
		if strings.Contains(lower, domain) {
			return fmt.Errorf("comment contains blacklisted URL domain: %s", domain)
		}
	}
	return nil
}

func wordSet(text string) map[string]bool {
	words := strings.Fields(strings.ToLower(text))
	set := make(map[string]bool, len(words))
	for _, w := range words {
		// Strip basic punctuation
		w = strings.Trim(w, ".,!?;:'\"()[]{}"+"\u3002\uff0c\uff01\uff1f\uff1b\uff1a\u201c\u201d\u2018\u2019\uff08\uff09\u3010\u3011")
		if len(w) > 1 {
			set[w] = true
		}
	}
	return set
}
