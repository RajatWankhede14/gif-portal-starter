import React, {useState, useEffect} from 'react';
import './App.css';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import {Program, Provider, web3} from "@project-serum/anchor";
import storedIdl from "./assets/solana_gifs.json";
import kp from "./keypair.json";
import upvoteLike from "./assets/like.png";
import {AiOutlineHeart, AiFillHeart} from "react-icons/ai"

const {SystemProgram, Keypair} = web3;

const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

const programID = new PublicKey(storedIdl.metadata.address);

const network = clusterApiUrl("devnet");

const opts = {preflightCommitment: "processed"}

// Constants
const TEST_GIFS = [
	'https://i.giphy.com/media/eIG0HfouRQJQr1wBzz/giphy.webp',
	'https://media3.giphy.com/media/L71a8LW2UrKwPaWNYM/giphy.gif?cid=ecf05e47rr9qizx2msjucl1xyvuu47d7kf25tqt2lvo024uo&rid=giphy.gif&ct=g',
	'https://media4.giphy.com/media/AeFmQjHMtEySooOc8K/giphy.gif?cid=ecf05e47qdzhdma2y3ugn32lkgi972z9mpfzocjj6z1ro4ec&rid=giphy.gif&ct=g',
	'https://i.giphy.com/media/PAqjdPkJLDsmBRSYUp/giphy.webp'
]

const App = () => {

  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState(null);

  
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const upvoteGif = async() => {
    console.log("upvote done");
  } 

  const renderConnectedContainer = () => {
    if(gifList == null) {
      return <div className="connected-container">
        <button className='cta-button submit-gif-button' onClick={createGifAccount}>Do One-Time Initialization For GIF Program Account</button>
      </div>
    } 
    else {
      return (
    <div className="connected-container">
      <form
      onSubmit={(event) => {
        event.preventDefault();
        sendGif();
      }}
    >
      <input type="text" placeholder="Enter gif link!" value={inputValue}
      onChange={onInputChange} />
      <button type="submit" onClick={sendGif} className="cta-button submit-gif-button">Submit</button>
     
    </form>
      <div className="gif-grid">
        {gifList.map((item, index) => (
          <div className="gif-item" key={index}>
            <img src={item.gifLink} alt={item.gifLink} className="gifImg" />
            <p className={"userAddressPara"}>{item.userAddress.toString()}</p>
            <div className="upvoteBtnDiv" onClick={upvoteGif}>
              <AiOutlineHeart color='#fff' size={30} />
              <span></span>
            </div>
          </div>
        ))}
      </div>
    </div>)}
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(connection, window.solana, opts.preflightCommitment);
    return provider;
  }

  const getProgram = async() => {
    const idl = await Program.fetchIdl(programID, getProvider());
    return new Program(idl, programID, getProvider());
  }

  const createGifAccount = async() => {
    try {
      const provider = getProvider();
      const program = await getProgram();

      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      await getGifList();
    } catch (error) {
      console.log(error)
    }
  }

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!!");
      return
    } 
    setInputValue("");
    console.log("Gif Link: ", inputValue);
    try {
      const provider = await getProvider();
      const program = await getProgram();

      await program.rpc.addGifs(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey
        }
      });
      await getGifList();
    } catch (error) {
      console.log(error)
    }
  };

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  const getGifList = async() => {
    try {
      const program = await getProgram();
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account", account);

      setGifList(account.gifList);
    } catch(err) {
      console.log(err);
      setGifList(null);
    }
  }

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList();
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 Movies GIF Portal</p>
          <p className="sub-text">
            View your Movies GIF collection in the metaverse ✨
          </p>
        </div>
        {!walletAddress && renderNotConnectedContainer()}
        {walletAddress && renderConnectedContainer()}
      </div>
    </div>
  );
};

export default App;
