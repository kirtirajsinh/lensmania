import React, { useState, createContext, useEffect, useContext } from 'react'
import { useAccount, useProvider, useSigner } from 'wagmi'
import { refreshAuthToken } from '../api'


export const WalletContext = createContext([])
export const WalletProvider = ({children}) => {
    const [lensProfile, setLensProfile] = useState(null)
    const [lensToken, setLensToken] = useState(null)
    const [lensHandle, setLensHandle] = useState(null)

    const {address, isDisconnected} = useAccount();

    useEffect(() => {
      refreshAuthToken();
      async function checkProfile() {
        if (address && localStorage.getItem('STORAGE_KEY')) {
          const token = JSON.parse(localStorage.getItem('STORAGE_KEY'));
          console.log('Success Token From STORAGE_KEY', token)
          setLensToken(token.accessToken)
        } else {
          console.log('Not Logged In')
        }
      }
      checkProfile();
    }, []);

  return (
    <WalletContext.Provider value={{ lensProfile, setLensProfile, lensHandle, setLensHandle, lensToken, setLensToken }}>
    {children}
</WalletContext.Provider>
    )
}
export const useProfile = () => useContext(WalletContext)