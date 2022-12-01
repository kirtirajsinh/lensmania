import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useEffect } from 'react'
import { useAccount, useProvider, useSigner, useSignMessage } from 'wagmi';
import { client, challenge, authenticate, getDefaultProfile, parseJwt } from '../api'
import {useProfiles} from '../components/WalletContext'
import { useProfile, usePublications } from "@memester-xyz/lens-use";


export default function Home() {
  const {address, isDisconnected} = useAccount();
  const [session, setSession] = useState(null)
  const { signMessageAsync } = useSignMessage({
      onSettled(data, error) {
        console.log("Settled", { data, error });
      },
    });
    const {setLensToken, setLensHandle, setLensProfile, lensHandle, lensToken} = useProfiles()

    const { data } = useProfile("boredhead.lens");
    // const { publications } = usePublications(profileId, [PublicationType.POST, PublicationType.COMMENT]);


    useEffect(() =>{
      console.log('data', data)
      
      // if (data) {
      //   console.log('publications', publications)
      // }
    }
    , [data])

    useEffect(() => {
      if(address){
        getProfiles();
      }
    }, [address])

    const getProfiles = async () => {
      const response = await client.query({
        query: getDefaultProfile,
        variables: { address: address }
      })
      console.log(response.data.defaultProfile.handle)
      setLensHandle(response.data.defaultProfile.handle)
    }


    const login = async() =>{
      try {
        /* first request the challenge from the API server */
        const challengeInfo = await client.query({
          query: challenge,
          variables: { address }
        })
          console.log({challengeInfo})
        /* ask the user to sign a message with the challenge info returned from the server */
        const signature = await signMessageAsync({message: challengeInfo.data.challenge.text})
        console.log(signature)
        /* authenticate the user */
        const authData = await client.mutate({
          mutation: authenticate,
          variables: {
            address, signature
          }
        })
              /* if user authentication is successful, you will receive an accessToken and refreshToken */
              const { accessToken, refreshToken } = authData.data.authenticate;
              const accessTokenData = parseJwt(accessToken);
              setLensToken(accessToken)
              console.log(accessToken, refreshToken)
              localStorage.setItem(
                'STORAGE_KEY',
                JSON.stringify({
                  accessToken,
                  refreshToken,
                  exp: accessTokenData.exp,
                })
              );
      } catch (err) {
        console.log('Error signing in: ', err)
      }

    }
  return (
    <>
      <ConnectButton />
      { !isDisconnected && !lensToken && <button onClick={login}>Login with Lens</button>}
      {lensToken && address && <div>Logged in as {lensHandle}</div>}
    </>
  )
}
