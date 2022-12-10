import '@rainbow-me/rainbowkit/styles.css';

import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {
  chain,
  configureChains,
  createClient,
  WagmiConfig,
} from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import {WalletProvider} from '../components/WalletContext'
import { ApolloClient, InMemoryCache, ApolloProvider, gql } from '@apollo/client';
import { client } from '../api';
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
const queryClient = new QueryClient();




const { chains, provider } = configureChains(
  [chain.mainnet, chain.polygonMumbai, chain.polygon, chain.optimism, chain.arbitrum],
  [
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'My RainbowKit App',
  chains
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider
})

const apolloClient = new ApolloClient({
  uri: 'https://api.lens.dev',
  cache: new InMemoryCache(),
});


function MyApp({ Component, pageProps }) {
  return(
    
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
    <QueryClientProvider client={queryClient} contextSharing={true}>
      <ApolloProvider client={client} >
        <WalletProvider>
           <Component {...pageProps} />
        </WalletProvider>
        </ApolloProvider>
          </QueryClientProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )

}

export default MyApp
