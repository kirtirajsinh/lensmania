import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client'
import { utils, ethers } from 'ethers'
import { setContext } from '@apollo/client/link/context';

const API_URL = 'https://api.lens.dev'


const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
    const token = window.localStorage.getItem('lens-auth-token')
    console.log({token})
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      }
    }
  })
  
  const httpLink = createHttpLink({
    uri: API_URL
  })
  
  export const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache()
  })


  export const challenge = gql`
  query Challenge($address: EthereumAddress!) {
    challenge(request: { address: $address }) {
      text
    }
  }
`

export const authenticate = gql`
  mutation Authenticate(
    $address: EthereumAddress!
    $signature: Signature!
  ) {
    authenticate(request: {
      address: $address,
      signature: $signature
    }) {
      accessToken
      refreshToken
    }
  }
`

export const getDefaultProfile = gql`
query DefaultProfile($address: EthereumAddress!) {
  defaultProfile(request: { ethereumAddress: $address}) {
    id
    handle
  }
}
`

export const validateMetadata = gql`
query ValidatePublicationMetadata ($metadatav2: PublicationMetadataV2Input!) {
  validatePublicationMetadata(request: {
    metadatav2: $metadatav2
  }) {
    valid
    reason
  }
}
`

export function parseJwt(token) {
  var base64Url = token.split(".")[1];
  var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  var jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("") 
  );

  return JSON.parse(jsonPayload);
}

// Refresh Token 
const REFRESH_AUTHENTICATION = `
  mutation($request: RefreshRequest!) { 
    refresh(request: $request) {
      accessToken
      refreshToken
    }
 }`

 const refreshAuth = (refreshToken) => {
  return client.mutate({
    mutation: gql(REFRESH_AUTHENTICATION),
    variables: {
      request: {
        refreshToken,
      },
    },
  });
};

export async function refreshAuthToken() {
  const token = JSON.parse(localStorage.getItem('STORAGE_KEY'));
  console.log('LensToken', token)
  if (!token) return;
  try {
    console.log("token:", { token });
    const authData = await refreshAuth(token.refreshToken);

    console.log("authData:", { authData });
    const { accessToken, refreshToken } = authData.data.refresh;
    const exp = parseJwt(refreshToken).exp;

    localStorage.setItem(
      'STORAGE_KEY',
      JSON.stringify({
        accessToken,
        refreshToken,
        exp,
      })
    );

  } catch (err) {
    // refresh();
  }
}

export const CREATE_POST_TYPED_DATA = `
mutation($request: CreatePublicPostRequest!) { 
  createPostTypedData(request: $request) {
    id
    expiresAt
    typedData {
      types {
        PostWithSig {
          name
          type
        }
      }
      domain {
        name
        chainId
        version
        verifyingContract
      }
      value {
        nonce
        deadline
        profileId
        contentURI
        collectModule
        collectModuleInitData
        referenceModule
        referenceModuleInitData
      }
    }
 }
}
`;