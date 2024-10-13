import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [recipientId, setRecipientId] = useState('');
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    const checkLoginStatus = async () => {
      // Check if there's a code parameter in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        // If there's a code, exchange it for an access token
        try {
          const response = await fetch('/api/exchange-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });

          if (response.ok) {
            const data = await response.json();
            setAccessToken(data.access_token);
            setIsLoggedIn(true);
            // Remove the code from the URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            console.error('Failed to exchange code for token');
          }
        } catch (error) {
          console.error('Error exchanging code for token:', error);
        }
      } else {
        // If there's no code, check if we have a stored token
        const storedToken = localStorage.getItem('instagram_access_token');
        if (storedToken) {
          setAccessToken(storedToken);
          setIsLoggedIn(true);
        }
      }
    };

    checkLoginStatus();
  }, []);

  const handleSendMessage = async () => {
    if (!accessToken) {
      console.error('No access token available');
      return;
    }

    const response = await fetch('/api/send-instagram-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientId,
        messageText,
        accessToken,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Message sent successfully:', data);
    } else {
      const errorData = await response.json();
      console.error('Error sending message:', errorData.error);
    }
  };

  if (!isLoggedIn)
     {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Welcome to the In Touch Prototype
            Edit <code>src/App.js</code> and save to reload.
          </p>
          {/* Instagram Login Button */}
          <a
            className="App-link"
            href="https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=1063901652121985&redirect_uri=https://intouch-lvyr.onrender.com/&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish"
            target="_blank"
            rel="noopener noreferrer"
          >
            Login with Instagram
          </a>
        </header>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Instagram Messaging</h1>
      <input
        type="text"
        placeholder="Recipient ID"
        value={recipientId}
        onChange={(e) => setRecipientId(e.target.value)}
      />
      <textarea
        placeholder="Enter your message here..."
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
      />
      <button onClick={handleSendMessage}>Send Message</button>
    </div>
  );
}

export default App;