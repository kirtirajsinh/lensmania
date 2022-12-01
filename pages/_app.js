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

const { chains, provider } = configureChains(
  [chain.mainnet, chain.polygon, chain.optimism, chain.arbitrum],
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

function MyApp({ Component, pageProps }) {
  return(
    
  <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <WalletProvider>
 
         <Component {...pageProps} />
        </WalletProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )

}

export default MyApp
