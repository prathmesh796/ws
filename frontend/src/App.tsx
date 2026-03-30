import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080')

    ws.onopen = () => {
      console.log('WebSocket connection established')
      setSocket(ws)
    }

    ws.onmessage = (event) => {
      console.log('Received message:', event.data)
      setMessages((prevMessages) => [...prevMessages, event.data as string])
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket connection closed')
      setSocket(null)
    }

    return () => {
      ws.close()
    }
  }, [])

  const sendMessage = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (socket && socket.readyState === WebSocket.OPEN) {
      const messageInput = document.querySelector('input[name="message"]') as HTMLInputElement
      const message = messageInput.value
      socket.send(message)
      console.log('Sent message:', message)
      messageInput.value = ''
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  if (!socket) {
    return <div>Connecting to WebSocket...</div>
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">WebSocket Client</h1>
        <p className="text-lg text-gray-600 mb-8">Connected to WebSocket server</p>

        <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Messages:</h2>
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-300 h-64 overflow-y-auto">
            {messages.map((message, index) => (

              <p key={index} className={`text-gray-700 mb-2 ${index % 2 === 0 ? 'bg-gray-100' : 'bg-gray-200'} p-2 rounded-lg`}>
                {message}
              </p>
            ))}
          </div>  
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-indigo-200">
          <form action="" className="space-y-4">
            <input 
              type="text" 
              name='message'
              placeholder="Enter your message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button 
              type="submit" 
              onClick={sendMessage}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App
