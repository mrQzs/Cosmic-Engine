import { gql } from '@apollo/client';

export const COMMENTS_QUERY = gql`
  query Comments($bodySlug: String!, $cursor: String, $limit: Int) {
    comments(bodySlug: $bodySlug, cursor: $cursor, limit: $limit) {
      edges {
        cursor
        node {
          id
          bodySlug
          authorName
          authorEmail
          avatarSeed
          contentHtml
          orbitalParams {
            ringIndex
            orbitRadius
            orbitInclination
            phaseOffset
            eccentricity
            orbitalSpeed
          }
          parentId
          replies {
            id
            authorName
            avatarSeed
            contentHtml
            orbitalParams {
              ringIndex
              orbitRadius
              orbitInclination
              phaseOffset
              eccentricity
              orbitalSpeed
            }
            parentId
            pinned
            createdAt
            reactions {
              emoji
              count
            }
          }
          reactions {
            emoji
            count
          }
          pinned
          createdAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const CREATE_COMMENT_MUTATION = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
      bodySlug
      authorName
      authorEmail
      avatarSeed
      contentHtml
      orbitalParams {
        ringIndex
        orbitRadius
        orbitInclination
        phaseOffset
        eccentricity
        orbitalSpeed
      }
      parentId
      pinned
      createdAt
    }
  }
`;

export const DELETE_COMMENT_MUTATION = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;

export const PIN_COMMENT_MUTATION = gql`
  mutation PinComment($id: ID!, $pinned: Boolean!) {
    pinComment(id: $id, pinned: $pinned) {
      id
      pinned
    }
  }
`;

export const REQUEST_POW_CHALLENGE = gql`
  mutation RequestPowChallenge {
    requestPowChallenge {
      challengeId
      prefix
      difficulty
      expiresAt
    }
  }
`;

export const ADD_REACTION_MUTATION = gql`
  mutation AddReaction($input: AddReactionInput!) {
    addReaction(input: $input) {
      id
      targetId
      emoji
      count
    }
  }
`;
