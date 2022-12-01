import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useEffect } from 'react'
import { useAccount, useProvider, useSigner, useSignMessage } from 'wagmi';
import { client, challenge, authenticate, getDefaultProfile } from '../api'


export default function Home() {
  const {address, isDisconnected} = useAccount();
  const[lensToken, setLensToken] = useState(null)
  const [profileId, setProfileId] = useState(null)
  const [profile, setProfile] = useState(null)
  const[handle, setHandle] = useState(null)
  const [session, setSession] = useState(null)
  const { signMessageAsync } = useSignMessage({
      onSettled(data, error) {
        console.log("Settled", { data, error });
      },
    });

    useEffect(() => {
      if(address){
        getProfiles();
      }
    }, [setLensToken])

    const getProfiles = async () => {
      const response = await client.query({
        query: getDefaultProfile,
        variables: { address: address }
      })
      console.log(response.data.defaultProfile.handle)
      setProfileId(response.data.defaultProfile.id)
      setHandle(response.data.defaultProfile.handle)
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
        const { data: { authenticate: { accessToken }}} = authData
        setLensToken(accessToken)
        setSession(authData.data.authenticate)
      } catch (err) {
        console.log('Error signing in: ', err)
      }

    }
  return (
    <>
      <ConnectButton />
      {
        address && !lensToken && (
            <button onClick={login} className="border p-btn p-2 rounded " >Lens Login</button>
        )
      }
      {
        address && lensToken && (<button className=" border p-btn p-2 rounded">{handle}</button>)
      }
    </>
  )
}
