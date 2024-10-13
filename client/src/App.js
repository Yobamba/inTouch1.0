import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [hasCode, setHasCode] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    // If the code exists in the URL, set the state to show the messaging form
    if (code) {
      setHasCode(true);
    }
  }, []);

  const handleSendMessage = () => {
    // Message sending logic goes here
    console.log('Recipient ID:', recipientId);
    console.log('Message:', messageText);
  };

  // Conditionally render the login screen or the message form based on whether there's a code in the URL
  if (!hasCode) {
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
            href="https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=1063901652121985&redirect_uri=https://intouch1-0.onrender.com/&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish"
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
