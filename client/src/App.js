import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

function MessageSender() {
  const [recipientId, setRecipientId] = useState('');
  const [messageText, setMessageText] = useState('');
  const accessToken = process.env.META_APP_ACCESS_TOKEN; // Access token from environment variable
  const igUserId = '1063901652121985'; // Replace with your Instagram professional account ID
  
  const handleSendMessage = async () => {
    const url = `https://graph.instagram.com/v21.0/${igUserId}/messages`;
    const payload = {
      recipient: {
        id: recipientId, // Instagram-scoped ID of the recipient
      },
      message: {
        text: messageText, // The message text or link
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Message sent successfully:', data);
      } else {
        const errorData = await response.json();
        console.error('Error sending message:', errorData);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div>
      <h1>Send Instagram Message</h1>
      <input
        type="text"
        placeholder="Recipient Instagram ID (IGSID)"
        value={recipientId}
        onChange={(e) => setRecipientId(e.target.value)}
      />
      <textarea
        placeholder="Type your message here..."
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
      />
      <button onClick={handleSendMessage}>Send Message</button>
    </div>
  );
}

function App() {
  const [hasCode, setHasCode] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    // If the code exists in the URL, set the state to show the messaging form
    if (code) {
      setHasCode(true);
    }
  }, []);

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
      {/* Render MessageSender here */}
      <MessageSender />
    </div>
  );
}

export default App;
