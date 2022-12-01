import React, { useState, createContext, useEffect, useContext } from 'react'
import { useAccount, useProvider, useSigner } from 'wagmi'


export const WalletContext = createContext([])
export const WalletProvider = ({children}) => {
    const [lensProfile, setLensProfile] = useState(null)
    const [lensToken, setLensToken] = useState(null)
    const [lensHandle, setLensHandle] = useState(null)

  return (
    <WalletContext.Provider value={{ lensProfile, setLensProfile, lensHandle, setLensHandle, lensToken, setLensToken }}>
    {children}
</WalletContext.Provider>
    )
}
export const useProfile = () => useContext(WalletContext)