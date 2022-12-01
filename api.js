import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client'
import { utils, ethers } from 'ethers'
import { setContext } from '@apollo/client/link/context';

const API_URL = 'https://api.lens.dev'


const authLink = setContext((_, { headers }) => {
    const token = window.localStorage.getItem('lens-auth-token')
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