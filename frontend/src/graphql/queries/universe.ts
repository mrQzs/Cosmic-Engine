import { gql } from '@apollo/client';

export const UNIVERSE_QUERY = gql`
  query Universe {
    universe {
      galaxies {
        id
        name
        slug
        description
        position {
          x
          y
          z
        }
        colorScheme {
          primary
          secondary
          nebula
        }
        parent {
          id
          slug
        }
        children {
          id
          name
          slug
          articleCount
          starPhase
        }
        articleCount
        starPhase
        bodies {
          ... on Planet {
            id
            title
            slug
            excerpt
            viewCount
            commentCount
            tags {
              id
              name
              slug
              color
            }
            physicsParams {
              mass
              orbitRadius
              eccentricity
              orbitInclination
              phaseOffset
              orbitalSpeed
              textureSeed
            }
            aestheticsParams {
              planetType
              baseColorHSL {
                h
                s
                l
              }
              atmosphereColor
              surfaceRoughness
              hasRing
              glowIntensity
              noiseType
            }
          }
        }
      }
      stats {
        totalPlanets
        totalComments
        totalGalaxies
        totalTags
        totalViews
        runningDays
      }
    }
  }
`;

export const GALAXY_QUERY = gql`
  query Galaxy($slug: String!) {
    galaxy(slug: $slug) {
      id
      name
      slug
      description
      position {
        x
        y
        z
      }
      colorScheme {
        primary
        secondary
        nebula
      }
      parent {
        id
        name
        slug
      }
      children {
        id
        name
        slug
        articleCount
        starPhase
      }
      articleCount
      starPhase
      bodies {
        ... on Planet {
          id
          title
          slug
          excerpt
          viewCount
          commentCount
          publishedAt
          tags {
            id
            name
            slug
            color
          }
          physicsParams {
            mass
            orbitRadius
            eccentricity
            orbitInclination
            phaseOffset
            orbitalSpeed
            textureSeed
          }
          aestheticsParams {
            planetType
            baseColorHSL {
              h
              s
              l
            }
            atmosphereColor
            surfaceRoughness
            hasRing
            glowIntensity
            noiseType
          }
        }
      }
    }
  }
`;

export const PLANET_QUERY = gql`
  query Planet($slug: String!) {
    planet(slug: $slug) {
      id
      title
      slug
      excerpt
      coverUrl
      content
      readingTime
      publishedAt
      viewCount
      commentCount
      pinned
      tags {
        id
        name
        slug
        color
      }
      galaxy {
        id
        name
        slug
      }
      star {
        id
        name
        slug
      }
      physicsParams {
        mass
        orbitRadius
        eccentricity
        orbitInclination
        phaseOffset
        orbitalSpeed
        textureSeed
      }
      aestheticsParams {
        planetType
        baseColorHSL {
          h
          s
          l
        }
        atmosphereColor
        surfaceRoughness
        hasRing
        glowIntensity
        noiseType
      }
      relatedPlanets {
        id
        title
        slug
        excerpt
        aestheticsParams {
          baseColorHSL {
            h
            s
            l
          }
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const SEARCH_QUERY = gql`
  query SearchBodies($query: String!, $galaxySlug: String, $page: Int, $pageSize: Int) {
    searchBodies(query: $query, galaxySlug: $galaxySlug, page: $page, pageSize: $pageSize) {
      items {
        ... on Planet {
          id
          title
          slug
          excerpt
          tags {
            name
            slug
            color
          }
          galaxy {
            name
            slug
          }
          aestheticsParams {
            baseColorHSL {
              h
              s
              l
            }
          }
        }
      }
      total
      page
      pageSize
      hasMore
    }
  }
`;
