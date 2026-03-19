'use client';

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Universe: { keyFields: [] },
      Galaxy: { keyFields: ['slug'] },
      Planet: { keyFields: ['slug'] },
      Tag: { keyFields: ['slug'] },
      Comment: { keyFields: ['id'] },
      CommentConnection: { keyFields: false },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all' },
    query: { fetchPolicy: 'cache-first', errorPolicy: 'all' },
  },
});
