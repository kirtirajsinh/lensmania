import { useRefresh } from '@memester-xyz/lens-use'
import React, { useState, createContext, useEffect, useContext } from 'react'
import { useAccount, useProvider, useSigner } from 'wagmi'
import { refreshAuthToken } from '../api'


export const WalletContext = createContext([])
export const WalletProvider = ({children}) => {
    const [lensProfile, setLensProfile] = useState(null)
    const [lensToken, setLensToken] = useState(null)
    const [lensHandle, setLensHandle] = useState(null)
    const [refreshToken, setRefreshToken] = useState(null)
    const {address, isDisconnected} = useAccount();

    // const [refresh, { data: refreshData }] = useRefresh(refreshToken);


    // useEffect(() => {
    //   // try{
    //     // refreshAuthToken();
    //   // }
    //   // catch{
    //   //   // refresh();
    //   // }
    //   async function checkProfile() {
    //     if (address && localStorage.getItem('STORAGE_KEY')) {
    //       const token = JSON.parse(localStorage.getItem('STORAGE_KEY'));
    //       console.log('Success Token From STORAGE_KEY', token) 
    //       setLensToken(token.accessToken)
    //     } else {
    //       console.log('Not Logged In')
    //     }
    //   }
    //   checkProfile();
    // }, [address]);

    // useEffect(()=>{
    //   if(refreshData){
    //     console.log('refreshData', refreshData)
    //     setLensToken(refreshData.refresh)
    //   }
    // },[refreshData])

  return (
    <WalletContext.Provider value={{ lensProfile, setLensProfile, lensHandle, setLensHandle, lensToken, setLensToken, setRefreshToken, refreshToken}}>
    {children}
</WalletContext.Provider>
    )
}
export const useProfiles = () => useContext(WalletContext)