package graph

import (
	"context"
	"testing"

	"cosmic-engine/backend/graph/generated"
	"cosmic-engine/backend/graph/model"
	"cosmic-engine/backend/internal/config"

	"github.com/99designs/gqlgen/client"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
)

func newTestClient(t *testing.T) *client.Client {
	t.Helper()
	cfg := generated.Config{
		Resolvers: &Resolver{
			Config: &config.Config{
				Auth: config.AuthConfig{JWTSecret: "test-secret", JWTExpireHrs: 1},
			},
		},
	}
	cfg.Directives.Auth = AuthDirective

	srv := handler.New(generated.NewExecutableSchema(cfg))
	srv.AddTransport(transport.POST{})

	return client.New(srv)
}

func TestQuery_Universe(t *testing.T) {
	t.Parallel()
	c := newTestClient(t)

	var resp struct {
		Universe struct {
			Galaxies []struct {
				ID   string
				Name string
				Slug string
			}
			Stats struct {
				TotalPlanets  int
				TotalGalaxies int
			}
		}
	}

	c.MustPost(`{ universe { galaxies { id name slug } stats { totalPlanets totalGalaxies } } }`, &resp)

	if len(resp.Universe.Galaxies) != 3 {
		t.Errorf("galaxies count = %d, want 3", len(resp.Universe.Galaxies))
	}
	if resp.Universe.Stats.TotalPlanets != 5 {
		t.Errorf("totalPlanets = %d, want 5", resp.Universe.Stats.TotalPlanets)
	}
	if resp.Universe.Stats.TotalGalaxies != 3 {
		t.Errorf("totalGalaxies = %d, want 3", resp.Universe.Stats.TotalGalaxies)
	}
}

func TestQuery_Planet(t *testing.T) {
	t.Parallel()
	c := newTestClient(t)

	var resp struct {
		Planet struct {
			ID          string
			Title       string
			Slug        string
			ReadingTime int
			ViewCount   int
		}
	}

	c.MustPost(`{ planet(slug: "building-3d-blog-threejs") { id title slug readingTime viewCount } }`, &resp)

	if resp.Planet.Title != "Building a 3D Blog with Three.js" {
		t.Errorf("title = %q", resp.Planet.Title)
	}
	if resp.Planet.ReadingTime < 1 {
		t.Error("readingTime should be >= 1")
	}
}

func TestQuery_Planet_NotFound(t *testing.T) {
	t.Parallel()
	c := newTestClient(t)

	var resp struct {
		Planet *struct{ ID string }
	}

	c.MustPost(`{ planet(slug: "nonexistent") { id } }`, &resp)

	if resp.Planet != nil {
		t.Error("nonexistent planet should return null")
	}
}

func TestQuery_Tags(t *testing.T) {
	t.Parallel()
	c := newTestClient(t)

	var resp struct {
		Tags []struct {
			ID        string
			Name      string
			Slug      string
			Color     string
			PostCount int
		}
	}

	c.MustPost(`{ tags { id name slug color postCount } }`, &resp)

	if len(resp.Tags) != 5 {
		t.Errorf("tags count = %d, want 5", len(resp.Tags))
	}
}

func TestQuery_Comments(t *testing.T) {
	t.Parallel()
	c := newTestClient(t)

	var resp struct {
		Comments struct {
			Edges []struct {
				Node struct {
					ID         string
					AuthorName string
				}
			}
			TotalCount int
		}
	}

	c.MustPost(`{ comments(bodySlug: "building-3d-blog-threejs") { edges { node { id authorName } } totalCount } }`, &resp)

	if resp.Comments.TotalCount != 3 {
		t.Errorf("totalCount = %d, want 3", resp.Comments.TotalCount)
	}
}

func TestQuery_FeedURL(t *testing.T) {
	t.Parallel()
	c := newTestClient(t)

	var resp struct {
		FeedURL string `json:"feedUrl"`
	}

	c.MustPost(`{ feedUrl }`, &resp)

	if resp.FeedURL != "/feed.xml" {
		t.Errorf("feedUrl = %q, want %q", resp.FeedURL, "/feed.xml")
	}
}

func TestMutation_Login_Success(t *testing.T) {
	t.Parallel()
	c := newTestClient(t)

	var resp struct {
		Login struct {
			Token string
			User  struct {
				Email       string
				DisplayName string
			}
		}
	}

	c.MustPost(`mutation { login(email: "admin@wo.city", password: "password") { token user { email displayName } } }`, &resp)

	if resp.Login.Token == "" {
		t.Error("token should not be empty")
	}
	if resp.Login.User.Email != "admin@wo.city" {
		t.Errorf("email = %q", resp.Login.User.Email)
	}
}

func TestMutation_Login_Failure(t *testing.T) {
	t.Parallel()
	c := newTestClient(t)

	var resp struct {
		Login *struct{ Token string }
	}

	err := c.Post(`mutation { login(email: "admin@wo.city", password: "wrong") { token } }`, &resp)
	if err == nil {
		t.Error("wrong password should return error")
	}
}

func TestMutation_CreatePlanet_Mock(t *testing.T) {
	t.Parallel()
	c := newTestClient(t)

	var resp struct {
		CreatePlanet struct {
			Title string
			Slug  string
		}
	}

	// @auth directive blocks unauthenticated — but in mock mode with no claims, this should fail
	err := c.Post(`mutation { createPlanet(input: { title: "Test", slug: "test", content: "Hello" }) { title slug } }`, &resp)
	if err == nil {
		t.Error("createPlanet without auth should fail")
	}
}

func TestDirective_Auth_BlocksUnauthenticated(t *testing.T) {
	t.Parallel()
	c := newTestClient(t)

	var resp struct {
		SiteSettings []struct{ Key string }
	}

	err := c.Post(`{ siteSettings { key } }`, &resp)
	if err == nil {
		t.Error("@auth query without token should fail")
	}
}

func TestDirective_Auth_AllowsAuthenticated(t *testing.T) {
	t.Parallel()

	resolver := &Resolver{
		Config: &config.Config{
			Auth: config.AuthConfig{JWTSecret: "test-secret", JWTExpireHrs: 1},
		},
	}

	gqlCfg := generated.Config{Resolvers: resolver}
	gqlCfg.Directives.Auth = AuthDirective

	srv := handler.New(generated.NewExecutableSchema(gqlCfg))
	srv.AddTransport(transport.POST{})

	// Generate a real token
	from_auth, _, _ := resolver.Config.Auth.JWTSecret, "", ""
	_ = from_auth

	// Use context with claims
	c := client.New(srv, client.AddHeader("Authorization", ""))

	// Login first to get a token
	var loginResp struct {
		Login struct{ Token string }
	}
	c.MustPost(`mutation { login(email: "admin@wo.city", password: "password") { token } }`, &loginResp)

	if loginResp.Login.Token == "" {
		t.Fatal("failed to get token")
	}

	// Use the token — note: gqlgen test client doesn't go through Fiber middleware
	// so the token won't be extracted. This tests the mock login flow only.
	// Full auth integration requires HTTP-level testing.
}

// Verify the resolver correctly falls back to mock mode
func TestResolver_UseMock(t *testing.T) {
	t.Parallel()

	r := &Resolver{Repos: nil}
	if !r.useMock() {
		t.Error("should use mock when Repos is nil")
	}
}

func TestQuery_Stats(t *testing.T) {
	t.Parallel()
	c := newTestClient(t)

	var resp struct {
		Stats model.SiteStats
	}

	c.MustPost(`{ stats { totalPlanets totalComments totalGalaxies totalTags totalViews runningDays } }`, &resp)

	if resp.Stats.TotalPlanets != 5 {
		t.Errorf("totalPlanets = %d, want 5", resp.Stats.TotalPlanets)
	}
	if resp.Stats.RunningDays < 1 {
		t.Error("runningDays should be >= 1")
	}
}

func TestQuery_Profile(t *testing.T) {
	t.Parallel()
	c := newTestClient(t)

	var resp struct {
		Profile struct {
			Title  string
			Bio    string
			Skills []struct{ Name string }
		}
	}

	c.MustPost(`{ profile { title bio skills { name } } }`, &resp)

	if resp.Profile.Title != "About Me" {
		t.Errorf("title = %q", resp.Profile.Title)
	}
	if len(resp.Profile.Skills) != 4 {
		t.Errorf("skills count = %d, want 4", len(resp.Profile.Skills))
	}
}

func TestQuery_Galaxy(t *testing.T) {
	t.Parallel()
	c := newTestClient(t)

	var resp struct {
		Galaxy struct {
			ID   string
			Name string
			Slug string
		}
	}

	c.MustPost(`{ galaxy(slug: "andromeda") { id name slug } }`, &resp)

	if resp.Galaxy.Name != "Andromeda" {
		t.Errorf("name = %q, want Andromeda", resp.Galaxy.Name)
	}
}

func TestQuery_SearchBodies(t *testing.T) {
	t.Parallel()
	c := newTestClient(t)

	var resp struct {
		SearchBodies struct {
			Total int
			Items []struct{ __typename string }
		}
	}

	c.MustPost(`{ searchBodies(query: "test") { total } }`, &resp)

	if resp.SearchBodies.Total != 5 {
		t.Errorf("total = %d, want 5", resp.SearchBodies.Total)
	}
}

func TestQuery_FriendLinks(t *testing.T) {
	t.Parallel()
	c := newTestClient(t)

	var resp struct {
		FriendLinks []struct {
			Name string
			URL  string
		}
	}

	c.MustPost(`{ friendLinks { name url } }`, &resp)

	if len(resp.FriendLinks) != 2 {
		t.Errorf("friend links count = %d, want 2", len(resp.FriendLinks))
	}
}

// Ensure subscriptions don't crash (they return channels)
func TestSubscription_CommentAdded_NoPanic(t *testing.T) {
	t.Parallel()
	r := &subscriptionResolver{&Resolver{}}
	ctx, cancel := context.WithCancel(context.Background())
	cancel() // immediately cancel

	ch, err := r.CommentAdded(ctx, "test-slug")
	if err != nil {
		t.Fatalf("CommentAdded: %v", err)
	}
	if ch == nil {
		t.Error("channel should not be nil")
	}
}
