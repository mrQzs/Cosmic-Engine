package graph

import (
	"time"

	"cosmic-engine/backend/graph/model"
)

func dt(s string) model.DateTime {
	t, _ := time.Parse(time.RFC3339, s)
	return model.DateTime{Time: t}
}

func strPtr(s string) *string   { return &s }
func intPtr(i int) *int         { return &i }
func floatPtr(f float64) *float64 { return &f }
func boolPtr(b bool) *bool      { return &b }

var mockGalaxies = []*model.Galaxy{
	{
		ID:          "g-001",
		Name:        "Andromeda",
		Slug:        "andromeda",
		Description: strPtr("The galaxy of web development and frontend technologies"),
		Position:    &model.BaseCoordinates{X: 100, Y: 0, Z: -200},
		ColorScheme: &model.GalaxyColorScheme{Primary: "#38bdf8", Secondary: "#6b21a8", Nebula: strPtr("#1e3a5f")},
		Children:    []*model.Galaxy{},
		Bodies:      []model.CelestialBody{},
		ArticleCount: 25,
		StarPhase:   nil,
		CreatedAt:   dt("2024-01-01T00:00:00Z"),
		UpdatedAt:   dt("2024-06-15T12:00:00Z"),
	},
	{
		ID:          "g-002",
		Name:        "Milky Way",
		Slug:        "milky-way",
		Description: strPtr("Backend engineering, databases, and system design"),
		Position:    &model.BaseCoordinates{X: -150, Y: 50, Z: 100},
		ColorScheme: &model.GalaxyColorScheme{Primary: "#fb923c", Secondary: "#e2e8f0", Nebula: strPtr("#4a2c0f")},
		Children:    []*model.Galaxy{},
		Bodies:      []model.CelestialBody{},
		ArticleCount: 18,
		StarPhase:   nil,
		CreatedAt:   dt("2024-01-15T00:00:00Z"),
		UpdatedAt:   dt("2024-06-20T12:00:00Z"),
	},
	{
		ID:          "g-003",
		Name:        "Triangulum",
		Slug:        "triangulum",
		Description: strPtr("DevOps, cloud infrastructure, and tooling"),
		Position:    &model.BaseCoordinates{X: 50, Y: -100, Z: 150},
		ColorScheme: &model.GalaxyColorScheme{Primary: "#6b21a8", Secondary: "#38bdf8", Nebula: strPtr("#2d1350")},
		Children:    []*model.Galaxy{},
		Bodies:      []model.CelestialBody{},
		ArticleCount: 7,
		StarPhase:   nil,
		CreatedAt:   dt("2024-02-01T00:00:00Z"),
		UpdatedAt:   dt("2024-06-25T12:00:00Z"),
	},
}

func mockPhysics(mass, orbitR float64, seed int) *model.PhysicsParams {
	return &model.PhysicsParams{
		Mass:             mass,
		OrbitRadius:      orbitR,
		Eccentricity:     0.02,
		OrbitInclination: 0.1,
		PhaseOffset:      0.5,
		OrbitalSpeed:     0.3,
		TextureSeed:      seed,
	}
}

func mockAesthetics() *model.AestheticsParams {
	return &model.AestheticsParams{
		PlanetType:       "terrestrial",
		BaseColorHsl:     &model.HSLColor{H: 210, S: 0.7, L: 0.5},
		AtmosphereColor:  strPtr("#87CEEB"),
		SurfaceRoughness: 0.6,
		HasRing:          false,
		GlowIntensity:    0.3,
		NoiseType:        "perlin",
	}
}

func mockOrbital(ring int) *model.OrbitalParams {
	return &model.OrbitalParams{
		RingIndex:        ring,
		OrbitRadius:      2.0 + float64(ring)*0.5,
		OrbitInclination: 0.0,
		PhaseOffset:      float64(ring) * 1.2,
		Eccentricity:     0.01,
		OrbitalSpeed:     0.5,
	}
}

var mockPlanets = []*model.Planet{
	{
		ID:               "p-001",
		Title:            "Building a 3D Blog with Three.js",
		Slug:             "building-3d-blog-threejs",
		Excerpt:          strPtr("How to create an immersive space-themed blog using React Three Fiber"),
		Galaxy:           mockGalaxies[0],
		PhysicsParams:    mockPhysics(3.5, 8.0, 42),
		CreatedAt:        dt("2024-03-01T10:00:00Z"),
		UpdatedAt:        dt("2024-03-15T14:00:00Z"),
		Content:          "# Building a 3D Blog\n\nThis is a comprehensive guide to building an immersive 3D blog experience using React Three Fiber and Three.js.\n\n## Getting Started\n\nFirst, set up your Next.js project with R3F...",
		ReadingTime:      8,
		Pinned:           true,
		PublishedAt:      &model.DateTime{Time: time.Date(2024, 3, 15, 14, 0, 0, 0, time.UTC)},
		Tags:             mockTags[:2],
		Comments:         []*model.Comment{},
		RelatedPlanets:   []*model.Planet{},
		AestheticsParams: mockAesthetics(),
		ViewCount:        1024,
		CommentCount:     5,
	},
	{
		ID:               "p-002",
		Title:            "Go Concurrency Patterns",
		Slug:             "go-concurrency-patterns",
		Excerpt:          strPtr("Deep dive into goroutines, channels, and concurrent design patterns in Go"),
		Galaxy:           mockGalaxies[1],
		PhysicsParams:    mockPhysics(4.2, 12.0, 99),
		CreatedAt:        dt("2024-04-01T08:00:00Z"),
		UpdatedAt:        dt("2024-04-10T16:00:00Z"),
		Content:          "# Go Concurrency Patterns\n\nGo's concurrency model is built on goroutines and channels...\n\n## Fan-Out / Fan-In\n\nOne of the most useful patterns...",
		ReadingTime:      12,
		Pinned:           false,
		PublishedAt:      &model.DateTime{Time: time.Date(2024, 4, 10, 16, 0, 0, 0, time.UTC)},
		Tags:             mockTags[1:3],
		Comments:         []*model.Comment{},
		RelatedPlanets:   []*model.Planet{},
		AestheticsParams: mockAesthetics(),
		ViewCount:        768,
		CommentCount:     3,
	},
	{
		ID:               "p-003",
		Title:            "PostgreSQL Performance Tuning",
		Slug:             "postgresql-performance-tuning",
		Excerpt:          strPtr("Optimizing PostgreSQL for high-traffic applications"),
		Galaxy:           mockGalaxies[1],
		PhysicsParams:    mockPhysics(5.0, 16.0, 7),
		CreatedAt:        dt("2024-05-01T09:00:00Z"),
		UpdatedAt:        dt("2024-05-20T11:00:00Z"),
		Content:          "# PostgreSQL Performance Tuning\n\nDatabase performance is critical...",
		ReadingTime:      15,
		Pinned:           false,
		PublishedAt:      &model.DateTime{Time: time.Date(2024, 5, 20, 11, 0, 0, 0, time.UTC)},
		Tags:             []*model.Tag{mockTags[2]},
		Comments:         []*model.Comment{},
		RelatedPlanets:   []*model.Planet{},
		AestheticsParams: mockAesthetics(),
		ViewCount:        512,
		CommentCount:     2,
	},
	{
		ID:               "p-004",
		Title:            "Docker Compose for Development",
		Slug:             "docker-compose-development",
		Excerpt:          strPtr("Setting up reproducible dev environments with Docker Compose"),
		Galaxy:           mockGalaxies[2],
		PhysicsParams:    mockPhysics(2.8, 6.0, 33),
		CreatedAt:        dt("2024-05-15T10:00:00Z"),
		UpdatedAt:        dt("2024-06-01T09:00:00Z"),
		Content:          "# Docker Compose for Development\n\nDocker Compose simplifies multi-container development...",
		ReadingTime:      6,
		Pinned:           false,
		PublishedAt:      &model.DateTime{Time: time.Date(2024, 6, 1, 9, 0, 0, 0, time.UTC)},
		Tags:             mockTags[2:4],
		Comments:         []*model.Comment{},
		RelatedPlanets:   []*model.Planet{},
		AestheticsParams: mockAesthetics(),
		ViewCount:        256,
		CommentCount:     1,
	},
	{
		ID:               "p-005",
		Title:            "GraphQL Schema Design",
		Slug:             "graphql-schema-design",
		Excerpt:          strPtr("Best practices for designing scalable GraphQL schemas"),
		Galaxy:           mockGalaxies[0],
		PhysicsParams:    mockPhysics(3.0, 10.0, 55),
		CreatedAt:        dt("2024-06-01T08:00:00Z"),
		UpdatedAt:        dt("2024-06-15T10:00:00Z"),
		Content:          "# GraphQL Schema Design\n\nDesigning a GraphQL schema is both art and science...",
		ReadingTime:      10,
		Pinned:           false,
		PublishedAt:      &model.DateTime{Time: time.Date(2024, 6, 15, 10, 0, 0, 0, time.UTC)},
		Tags:             mockTags[:2],
		Comments:         []*model.Comment{},
		RelatedPlanets:   []*model.Planet{},
		AestheticsParams: mockAesthetics(),
		ViewCount:        384,
		CommentCount:     4,
	},
}

var mockTags = []*model.Tag{
	{ID: "t-001", Name: "React", Slug: "react", Color: "#61DAFB", PostCount: 8},
	{ID: "t-002", Name: "TypeScript", Slug: "typescript", Color: "#3178C6", PostCount: 12},
	{ID: "t-003", Name: "Go", Slug: "go", Color: "#00ADD8", PostCount: 6},
	{ID: "t-004", Name: "Docker", Slug: "docker", Color: "#2496ED", PostCount: 4},
	{ID: "t-005", Name: "PostgreSQL", Slug: "postgresql", Color: "#336791", PostCount: 3},
}

var mockComments = []*model.Comment{
	{
		ID:            "c-001",
		BodySlug:      "building-3d-blog-threejs",
		AuthorName:    "Alice",
		AuthorEmail:   strPtr("alice@example.com"),
		AvatarSeed:    "alice-seed-001",
		ContentHTML:   "<p>Amazing article! The 3D effects are stunning.</p>",
		OrbitalParams: mockOrbital(0),
		Replies:       []*model.Comment{},
		Reactions:     []*model.Reaction{},
		Pinned:        false,
		CreatedAt:     dt("2024-03-16T08:00:00Z"),
	},
	{
		ID:            "c-002",
		BodySlug:      "building-3d-blog-threejs",
		AuthorName:    "Bob",
		AuthorEmail:   strPtr("bob@example.com"),
		AvatarSeed:    "bob-seed-002",
		ContentHTML:   "<p>How does this perform on mobile devices?</p>",
		OrbitalParams: mockOrbital(0),
		Replies:       []*model.Comment{},
		Reactions:     []*model.Reaction{},
		Pinned:        false,
		CreatedAt:     dt("2024-03-17T10:00:00Z"),
	},
	{
		ID:            "c-003",
		BodySlug:      "building-3d-blog-threejs",
		AuthorName:    "Charlie",
		AvatarSeed:    "charlie-seed-003",
		ContentHTML:   "<p>The adaptive quality system is genius!</p>",
		OrbitalParams: mockOrbital(1),
		ParentID:      strPtr("c-002"),
		Replies:       []*model.Comment{},
		Reactions:     []*model.Reaction{},
		Pinned:        false,
		CreatedAt:     dt("2024-03-17T14:00:00Z"),
	},
	{
		ID:            "c-004",
		BodySlug:      "go-concurrency-patterns",
		AuthorName:    "Dave",
		AuthorEmail:   strPtr("dave@example.com"),
		AvatarSeed:    "dave-seed-004",
		ContentHTML:   "<p>Great explanation of fan-out/fan-in!</p>",
		OrbitalParams: mockOrbital(0),
		Replies:       []*model.Comment{},
		Reactions:     []*model.Reaction{},
		Pinned:        true,
		CreatedAt:     dt("2024-04-11T09:00:00Z"),
	},
}

var mockFriendLinks = []*model.FriendLink{
	{
		ID:          "fl-001",
		Name:        "TechBlog",
		URL:         "https://techblog.example.com",
		Description: strPtr("A great tech blog"),
		SortOrder:   1,
		CreatedAt:   dt("2024-01-01T00:00:00Z"),
	},
	{
		ID:          "fl-002",
		Name:        "CodeCraft",
		URL:         "https://codecraft.example.com",
		Description: strPtr("Crafting code with care"),
		SortOrder:   2,
		CreatedAt:   dt("2024-02-01T00:00:00Z"),
	},
}

var mockUser = &model.User{
	ID:          "u-001",
	Username:    "admin",
	Email:       "admin@wo.city",
	DisplayName: "CyberGeek",
	Role:        model.UserRoleAdmin,
	CreatedAt:   dt("2024-01-01T00:00:00Z"),
}

var mockSiteSettings = []*model.SiteSetting{
	{Key: "site.title", Value: model.JSON{"value": "CyberGeek"}, UpdatedAt: dt("2024-01-01T00:00:00Z")},
	{Key: "site.subtitle", Value: model.JSON{"value": "Exploring the digital universe"}, UpdatedAt: dt("2024-01-01T00:00:00Z")},
	{Key: "theme.background_color", Value: model.JSON{"value": "#0a0a1a"}, UpdatedAt: dt("2024-01-01T00:00:00Z")},
}

var mockPulsar = &model.Pulsar{
	ID:      "pulsar-001",
	Title:   "About Me",
	Slug:    "about",
	Excerpt: strPtr("The mind behind CyberGeek"),
	PhysicsParams: mockPhysics(10.0, 0, 1),
	CreatedAt: dt("2024-01-01T00:00:00Z"),
	UpdatedAt: dt("2024-06-01T00:00:00Z"),
	Bio:     "# About CyberGeek\n\nA passionate developer exploring the digital cosmos.",
	Skills: []*model.Skill{
		{Name: "Go", Level: 90, Category: "Backend", Icon: strPtr("go")},
		{Name: "TypeScript", Level: 85, Category: "Frontend", Icon: strPtr("typescript")},
		{Name: "React", Level: 88, Category: "Frontend", Icon: strPtr("react")},
		{Name: "PostgreSQL", Level: 80, Category: "Database", Icon: strPtr("postgresql")},
	},
	Timeline: []*model.TimelineEvent{
		{Date: dt("2020-01-01T00:00:00Z"), Title: "Started coding", Description: strPtr("Began the journey")},
		{Date: dt("2024-01-01T00:00:00Z"), Title: "Launched CyberGeek", Description: strPtr("The cosmic blog goes live")},
	},
	SocialLinks: []*model.SocialLink{
		{Platform: "github", URL: "https://github.com/cybergeek"},
	},
	Stats: &model.ProfileStats{
		TotalPosts:    5,
		TotalWords:    15000,
		TotalComments: 10,
		RunningDays:   180,
	},
}
