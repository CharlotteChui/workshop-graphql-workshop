// import your npm packages
import ApolloClient from 'apollo-boost';
import { GetRepos, AddStar, RemoveStar } from './operations';

const client = new ApolloClient({
  uri: GITHUB_API,
  headers: { authorization: `bearer ${API_KEY}` },
});

// keys for actiontypes
export const ActionTypes = {
  FETCH_REPOS: 'FETCH_REPOS',
  ERROR_SET: 'ERROR_SET',
  STAR_CHANGE: 'STAR_CHANGE',
};

const GITHUB_API = 'https://api.github.com/graphql';
const API_KEY = '2c99c7274f819fa04dc7f589a15cf2255c471f5d';

// initialize ApolloClient here

export function fetchRepos(query) {
  query listRepos($queryString:String!){
    search(query: $queryString, type: USER, first:1) {
      edges {
        node {
          ... on User {
            name
            repositories(first: 20) {
              edges {
                node {
                  name
                  id
                  viewerHasStarred
                  createdAt
                  description
                  url
                  defaultBranchRef {
                    target {
                      ... on Commit {
                        history(first:10) {
                          totalCount
                          edges {
                            node {
                              ... on Commit {
                                committedDate
                                message
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return (dispatch) => {
    // fetchRepos query
    client.query({
      query: GetRepos,
      variables: {
        queryString: query,
      },
      fetchPolicy: 'no-cache',
    })
      .then((response) => {
        const repos = response.data.search.edges[0].node.repositories.edges.map(repo => repo.node);
        dispatch({ type: ActionTypes.FETCH_REPOS, payload: repos });
      })
      .catch((error) => {
        dispatch({ type: ActionTypes.ERROR_SET, error });
      });
  };
}

export function addStar(repoID, searchTerm) {
  mutation addStar($id: ID!) {
    addStar(input: { starrableId:$id }) {
      starrable {
        viewerHasStarred
      }
    }
  }
  return (dispatch) => {
    // addStar mutation

    client.mutate({
      mutation: AddStar,
      variables: {
        id: repoID,
      },
      fetchPolicy: 'no-cache',
    })
      .then((res) => {
        dispatch(fetchRepos(searchTerm));
      })
      .catch((error) => {
        dispatch({ type: ActionTypes.ERROR_SET, error });
      });
  };
}

export function removeStar(repoID, searchTerm) {
  mutation removeStar($id: ID!) {
    removeStar(input: { starrableId:$id }) {
      starrable {
        viewerHasStarred
      }
    }
  }
  return (dispatch) => {
    // removeStar mutation
    client.mutate({
      mutation: RemoveStar,
      variables: {
        id: repoID,
      },
      fetchPolicy: 'no-cache',
    })
      .then((response) => {
        dispatch(fetchRepos(searchTerm));
      })
      .catch((error) => {
        dispatch({ type: ActionTypes.ERROR_SET, error });
      });
  };
}
