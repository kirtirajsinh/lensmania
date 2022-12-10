import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useEffect } from 'react'
import { useAccount, useEnsAddress, useProvider, useSigner, useSignMessage } from 'wagmi';
import { client, challenge, authenticate, getDefaultProfile, parseJwt, CREATE_POST_TYPED_DATA } from '../api'
import {useProfiles} from '../components/WalletContext'
import { useAuthenticate, useChallenge, useDefaultProfile, usePost, useProfile, usePublications, useRefresh } from "@memester-xyz/lens-use";
import { gql } from '@apollo/client';
import omitDeep from "omit-deep";
import { utils, ethers } from "ethers";
import ABI from '../abi/abi.json'

export default function Home() {
  const {address, isDisconnected} = useAccount();
  const [session, setSession] = useState(null)
  const [signedChallenge, setSignedChallenge] = useState(null)
  const[stateRefreshToken, setStateRefreshToken] = useState(null) 
  const { signMessageAsync } = useSignMessage({
      onSettled(data, error) {
        console.log("Settled", { data, error });
      },
    });
    const {setLensToken, setLensHandle, setLensProfile, lensHandle, lensToken, setRefreshToken, lensProfile, refreshToken} = useProfiles()

    const { data } = useProfile("boredhead.lens");
    const { data: challengeData } = useChallenge(address);
    const [authenticate, { data: authenticateData }] = useAuthenticate(address, signedChallenge);
    const [refresh, { data: refreshData }] = useRefresh(stateRefreshToken);
    const defaultProfile = useDefaultProfile(address);
    const { data: signer, isError, isLoading } = useSigner()




    useEffect(() =>{
      console.log('challengeData', challengeData)
    },[challengeData])

    useEffect(() =>{
      console.log('authenticateData', authenticateData)
      
      if(authenticateData){
        setLensToken(authenticateData.authenticate.accessToken)
        localStorage.setItem('lens-auth-token',authenticateData.authenticate.accessToken)
        localStorage.setItem('lens-refresh-token',authenticateData.authenticate.refreshToken)
        console.log('access token', authenticateData.authenticate.accessToken)
      }
      
    }
    ,[authenticateData])


    useEffect(() =>{
      console.log('refreshData', refreshData)
    },[refreshData])

    useEffect(() =>{
      if(signedChallenge){
        authenticate();
      }
    },[signedChallenge])

    useEffect(()=>{
      if(defaultProfile){
        console.log('defaultProfile',defaultProfile )
        setLensProfile(defaultProfile)
      }
    },[address, defaultProfile])

    

    
    const login = async() =>{
      try {

        if(challengeData){
          const signature = await signMessageAsync({message: challengeData.challenge.text})
          console.log('signature', signature)
          setSignedChallenge(signature)
        }
      } catch (err) {
        console.log('Error signing in: ', err)
      }
    }

    async function createPostTypedData(createPostTypedDataRequest) {
      return client.mutate({
        mutation: gql(CREATE_POST_TYPED_DATA),
        variables: {
          request: createPostTypedDataRequest,
        },
      });
    }

    async function signedTypeData(domain, types, value) {
      // const signer = await wallet.getSigner();
      return signer._signTypedData(
        omitDeep(domain, "__typename"),
        omitDeep(types, "__typename"),
        omitDeep(value, "__typename")
      );
    }

    async function postWithSig(typedData) {
      console.log(typedData, 'typedData');
  
      const signature = await signedTypeData(
        typedData.domain,
        typedData.types,
        typedData.value
      );
  
      console.log("create post: signature", signature);
  
      const { v, r, s } = utils.splitSignature(signature);
      const lensHub = new ethers.Contract(
        '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d',
        ABI,
        signer
      );
    
      const tx = await lensHub.postWithSig({
        profileId: typedData.value.profileId,
        contentURI: typedData.value.contentURI,
        collectModule: typedData.value.collectModule,
        collectModuleInitData: typedData.value.collectModuleInitData,
        referenceModule: typedData.value.referenceModule,
        referenceModuleInitData: typedData.value.referenceModuleInitData,
        sig: {
          v,
          r,
          s,
          deadline: typedData.value.deadline,
        },
      });
      await tx.wait()
      console.log(tx);
      console.log('successfully created post: tx hash', tx.hash)
    }

    const postStuff = async() =>{
      const createPostRequest = {
        profileId: defaultProfile?.defaultProfile?.id,
        contentURI: `https://bafybeictejtykyt2a7mcurv6yom7phnz2wmvrhf2ynx3ewzddv2lfr2iua.ipfs.w3s.link/1efe42a6-be84-476b-a975-cab3b80b648a.webp`,
        // contentURI: `ipfs://${ipfsResult}`,
        collectModule: {
          freeCollectModule: {
            followerOnly: true,
          },
        },
        referenceModule: {
          followerOnlyReferenceModule: false,
        },
      };
      const result = await createPostTypedData(createPostRequest);

    console.log(result, 'result');

    await postWithSig(result.data.createPostTypedData.typedData);
    }
  return (
    <>
      <ConnectButton />
      { !isDisconnected && !lensToken && <button onClick={login}>Login with Lens</button>}
      {lensToken && address && <div>Logged in as {defaultProfile?.defaultProfile?.handle}</div>}
      {lensToken && address && <button onClick={() =>{postStuff()}}>Post</button>}
    </>
  )
}
