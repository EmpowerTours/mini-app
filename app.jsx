import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';

const App = () => {
  const { login, authenticated, user } = usePrivy();

  // Get Telegram user data
  const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const telegramId = telegramUser ? telegramUser.id.toString() : null;

  // Handle login and send to backend
  const handleLogin = async () => {
    if (!telegramId) {
      document.getElementById('status').innerText = 'Error: Telegram user not found';
      return;
    }
    try {
      await login();
      if (authenticated && user && user.wallet) {
        const walletAddress = user.wallet.address;
        const response = await fetch('https://mini-app-w2nf.onrender.com', {
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
          window.Telegram?.WebApp?.close();
        } else {
          document.getElementById('status').innerText = `Error: ${data.error || 'Authentication failed'}`;
        }
      }
    } catch (error) {
      document.getElementById('status').innerText = `Error: ${error.message}`;
    }
  };

  return (
    <div>
      <button onClick={handleLogin} disabled={authenticated}>
        {authenticated ? 'Connected' : 'Connect Wallet'}
      </button>
    </div>
  );
};

// Initialize Privy
const root = ReactDOM.createRoot(document.getElementById('privy-login'));
root.render(
  <PrivyProvider
    appId="cmaoduqox005ole0nmj1s4qck"
    config={{
      supportedChains: [{ id: 10143, name: 'Monad Testnet', rpcUrl: 'https://testnet-rpc.monad.xyz' }],
      loginMethods: ['metamask', 'wallet'],
      embeddedWallets: { createOnLogin: 'all-users' }
    }}
  >
    <App />
  </PrivyProvider>
);
