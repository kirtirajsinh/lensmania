import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useEffect } from 'react'
import { useAccount, useEnsAddress, useProvider, useSigner, useSignMessage } from 'wagmi';
import { client, challenge, authenticate, getDefaultProfile, parseJwt, CREATE_POST_TYPED_DATA, createPostTypedData } from '../api'
import {useProfiles} from '../components/WalletContext'
import { useAuthenticate, useChallenge, useDefaultProfile, usePost, useProfile, usePublications, useRefresh } from "@memester-xyz/lens-use";
import { gql } from '@apollo/client';
import omitDeep from "omit-deep";
import { utils, ethers } from "ethers";
import ABI from '../abi/abi.json'
import { create } from 'ipfs-http-client'
import { v4 as uuid } from 'uuid'

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
const projectSecret = process.env.NEXT_PUBLIC_PROJECT_SECRET
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const ipfsClient = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
      authorization: auth,
  },
})

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
    // const { data: challengeData } = useChallenge(address);
    // const [authenticate, { data: authenticateData }] = useAuthenticate(address, signedChallenge);
    // const [refresh, { data: refreshData }] = useRefresh(stateRefreshToken);
    const defaultProfile = useDefaultProfile(address);
    const { data: signer, isError, isLoading } = useSigner()
    const { data:publications } = usePublications(lensProfile?.defaultProfile?.id);
    const [file, setFile] = useState(null)
    const [postData, setPostData] = useState('')
    


    useEffect(() =>{
      console.log('Publications', publications)
    },[publications])

    // useEffect(() =>{
    //   console.log('challengeData', challengeData)
    // },[challengeData])

    // useEffect(() =>{
    //   console.log('authenticateData', authenticateData)
      
    //   if(authenticateData){
    //     setLensToken(authenticateData.authenticate.accessToken)
    //     localStorage.setItem('lens-auth-token',authenticateData.authenticate.accessToken)
    //     localStorage.setItem('lens-refresh-token',authenticateData.authenticate.refreshToken)
    //     console.log('access token', authenticateData.authenticate.accessToken)
    //   }
      
    // }
    // ,[authenticateData])


    // useEffect(() =>{
    //   console.log('refreshData', refreshData)
    // },[refreshData])

    // useEffect(() =>{
    //   if(signedChallenge){
    //     authenticate();
    //   }
    // },[signedChallenge])

    useEffect(()=>{
      if(defaultProfile){
        console.log('defaultProfile',defaultProfile )
        setLensProfile(defaultProfile)
      }
    },[address, defaultProfile])

    

    
    const login = async() =>{
      try {
        const challengeInfo = await client.query({
          query: challenge,
          variables: { address }
        })
        console.log(challengeInfo)
        if(challengeInfo){
          const signature = await signMessageAsync({message: challengeInfo.data.challenge.text})
          console.log('signature', signature)
          setSignedChallenge(signature)
          const authData = await client.mutate({
            mutation: authenticate,
            variables: {
              address, signature
            }
          })
          const { data: { authenticate: { accessToken }}} = authData
          console.log('authData', authData)
          setLensToken(accessToken)
          localStorage.setItem('lens-auth-token', accessToken)
          console.log('access token', accessToken)
          localStorage.setItem('lens-refresh-token',authData.data.authenticate.refreshToken)
          console.log('access token', authData.data.authenticate.refreshToken)
        }
      } catch (err) {
        console.log('Error signing in: ', err)
      }
    }

    // async function createPostTypedData(createPostTypedDataRequest) {
    //   return client.mutate({
    //     mutation: gql(CREATE_POST_TYPED_DATA),
    //     variables: {
    //       request: createPostTypedDataRequest,
    //     },
    //   });
    // }

    // async function signedTypeData(domain, types, value) {
    //   // const signer = await wallet.getSigner();
    //   return signer._signTypedData(
    //     omitDeep(domain, "__typename"),
    //     omitDeep(types, "__typename"),
    //     omitDeep(value, "__typename")
    //   );
    // }

    // async function postWithSig(typedData) {
    //   console.log(typedData, 'typedData');
  
    //   const signature = await signedTypeData(
    //     typedData.domain,
    //     typedData.types,
    //     typedData.value
    //   );
  
    //   console.log("create post: signature", signature);
  
    //   const { v, r, s } = utils.splitSignature(signature);
    //   const lensHub = new ethers.Contract(
    //     '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d',
    //     ABI,
    //     signer
    //   );
    
    //   const tx = await lensHub.postWithSig({
    //     profileId: typedData.value.profileId,
    //     contentURI: typedData.value.contentURI,
    //     collectModule: typedData.value.collectModule,
    //     collectModuleInitData: typedData.value.collectModuleInitData,
    //     referenceModule: typedData.value.referenceModule,
    //     referenceModuleInitData: typedData.value.referenceModuleInitData,
    //     sig: {
    //       v,
    //       r,
    //       s,
    //       deadline: typedData.value.deadline,
    //     },
    //   });
    //   await tx.wait()
    //   console.log(tx);
    //   console.log('successfully created post: tx hash', tx.hash)
    // }

    // \
    const splitSignature = (signature) => {
      return utils.splitSignature(signature)
    }
    const createPost = async() =>{
      if (!postData) return
      const ipfsData = await uploadToIPFS()
      const createPostRequest = {
        profileId: lensProfile.defaultProfile.id,
        contentURI: 'ipfs://' + ipfsData.path,
        collectModule: {
          freeCollectModule: { followerOnly: true }
        },
        referenceModule: {
          followerOnlyReferenceModule: false
        },
      }
      try {
        const signedResult = await signCreatePostTypedData(createPostRequest, lensToken)
        const lensHub = new ethers.Contract("0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d", ABI, signer)
        const typedData = signedResult.result.typedData
        const { v, r, s } = splitSignature(signedResult.signature)
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
        })
        console.log('successfully created post: tx hash', tx.hash)
      } catch (err) {
        console.log('error posting publication: ', err)
      }
    }

    
     
    
    
const onImageChange = (event) => {
  setPostData(event.target.value)
}
const validateMetadata = gql`
query ValidatePublicationMetadata ($metadatav2: PublicationMetadataV2Input!) {
  validatePublicationMetadata(request: {
    metadatav2: $metadatav2
  }) {
    valid
    reason
  }
}
`

async function uploadToIPFS() {
  const metaData = {
    version: '2.0.0',
    content: postData,
    description: "RANDOM POSTED PUB",
    name: `Post by @${defaultProfile?.defaultProfile?.handle}`,
    external_url: `https://lenster.xyz/u/${defaultProfile?.defaultProfile?.handle}`,
    metadata_id: uuid(),
    mainContentFocus: 'TEXT_ONLY',
    attributes: [],
    locale: 'en-US',
    appId: 'lenster'
  }
  const result = await client.query({
    query: validateMetadata,
    variables: {
      metadatav2: metaData
    }
  })
  console.log('Metadata verification request: ', result)
    
  const added = await ipfsClient.add(JSON.stringify(metaData))
  return added
}

const signCreatePostTypedData = async (request, token) => {
  const result = await createPostTypedDataMutation(request, token)
  const typedData = result.typedData
  const signature = await signedTypeData(typedData.domain, typedData.types, typedData.value);
  return { result, signature };
}
const signedTypeData = (
  domain,
  types,
  value,
) => {
  
  return signer._signTypedData(
    omitDeep(domain, '__typename'),
    omitDeep(types, '__typename'),
    omitDeep(value, '__typename')
  )
}

async function createPostTypedDataMutation (request, token) {
  const result = await client.mutate({
    mutation: createPostTypedData,
    variables: {
      request,
    },
    context: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  })
  return result.data.createPostTypedData
}
  return (
    <>
      <ConnectButton />
      { !isDisconnected && !lensToken && <button onClick={login}>Login with Lens</button>}
      {lensToken && address && <div>Logged in as {defaultProfile?.defaultProfile?.handle}</div>}
      {lensToken && address && postData && <button onClick={() =>{createPost()}}>Post</button>}
      {lensToken && address && <input
            type="text"
            onChange={(e) => onImageChange(e)}
          />}
    </>
  )
}
