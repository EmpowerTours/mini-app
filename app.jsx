import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';

const App = () => {
  const { login, authenticated, user, ready } = usePrivy();

  // Get Telegram user data
  const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const telegramId = telegramUser ? telegramUser.id.toString() : null;

  // Handle login
  const handleLogin = async () => {
    if (!telegramId) {
      document.getElementById('status').innerText = 'Error: Telegram user not found';
      console.error('Telegram user ID not found');
      return;
    }
    try {
      console.log('Initiating Privy login...');
      await login();
    } catch (error) {
      document.getElementById('status').innerText = `Error: ${error.message}`;
      console.error('Privy login error:', error);
    }
  };

  // Handle post-authentication logic
  useEffect(() => {
    if (ready && authenticated && user && user.wallet) {
      const walletAddress = user.wallet.address;
      console.log('Authenticated with wallet:', walletAddress, 'Connector:', user.wallet.connectorType);
      const sendToBackend = async () => {
        try {
          const response = await fetch('https://mini-app-w2nf.onrender.com/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramId,
              loginMethod: user.wallet.connectorType || 'embedded',
              loginData: { address: walletAddress }
            })
          });
          const data = await response.json();
          if (data.address) {
            document.getElementById('status').innerText = `Connected: ${data.address}`;
            console.log('Backend response:', data);
            window.Telegram?.WebApp?.close();
          } else {
            document.getElementById('status').innerText = `Error: ${data.error || 'Authentication failed'}`;
            console.error('Backend error:', data.error);
          }
        } catch (error) {
          document.getElementById('status').innerText = `Error: ${error.message}`;
          console.error('Backend request error:', error);
        }
      };
      sendToBackend();
    } else if (ready && !authenticated) {
      document.getElementById('status').innerText = 'Please connect your wallet';
    } else if (!ready) {
      console.log('Privy not ready yet');
    }
  }, [ready, authenticated, user, telegramId]);

  // Check for Telegram WebView and MetaMask availability
  if (window.Telegram?.WebApp && !window.ethereum) {
    return (
      <div>
        <p>MetaMask is not supported in Telegram WebView. Please open in a browser.</p>
        <a href="https://mini-app-w2nf.onrender.com" target="_blank">Open in Browser</a>
      </div>
    );
  }

  return (
    <div>
      <button onClick={handleLogin} disabled={authenticated || !ready}>
        {ready ? (authenticated ? 'Connected' : 'Connect Wallet') : 'Loading...'}
      </button>
    </div>
  );
};

// Initialize Privy
const root = ReactDOM.createRoot(document.getElementById('privy-login'));
const appId = import.meta.env.VITE_PRIVY_APP_ID || 'cmaoduqox005ole0nmj1s4qck';
const monadChain = {
  id: 10143,
  name: 'Monad Testnet',
  rpcUrls: ['https://testnet-rpc.monad.xyz'],
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  blockExplorers: [{ name: 'Monad Explorer', url: 'https://explorer.testnet.monad.xyz' }]
};
console.log('Privy appId:', appId);
console.log('Monad Chain Config:', monadChain);
try {
  root.render(
    <PrivyProvider
      appId={appId}
      config={{
        supportedChains: [],
        additionalChains: [monadChain],
        loginMethods: ['metamask'],
        embeddedWallets: { createOnLogin: 'all-users' },
        appearance: { theme: 'light' }
      }}
    >
      <App />
    </PrivyProvider>
  );
} catch (error) {
  console.error('Privy initialization error:', error);
  document.getElementById('status').innerText = 'Error: Failed to initialize wallet connection';
}
