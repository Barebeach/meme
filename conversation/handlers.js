import { isQuestion, isSpam, generateUniqueId } from '../utils/validation.js';

const MESSAGE_COOLDOWN = 2000;
const userLastMessage = new Map();
export const connectedUsers = new Map();
export const conversationQueue = [];
export const questions = [];

/**
 * Setup Socket.IO chat handlers
 * @param {Server} io - Socket.IO server instance
 */
export function setupChatHandlers(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join', (username) => {
      console.log(`👤 User joining - Socket: ${socket.id}, Username: ${username}`);
      
      if (!username || username.trim() === '') {
        console.error('Invalid username received');
        socket.emit('error', 'Invalid username');
        return;
      }
      
      const userColors = ['#8b5cf6', '#06b6d4', '#f59e0b'];
      const randomColor = userColors[Math.floor(Math.random() * userColors.length)];
      
      connectedUsers.set(socket.id, { 
        username: username.trim(), 
        joinedAt: Date.now(),
        color: randomColor
      });
      console.log(`✅ User registered: ${username} (Socket: ${socket.id}) - Color: ${randomColor}`);
      console.log(`Total connected users: ${connectedUsers.size}`);
      
      const displayCount = connectedUsers.size + 17;
      io.emit('user_count', displayCount);
      
      io.emit('message', {
        id: generateUniqueId(),
        user: 'System',
        message: `${username} joined the chat`,
        timestamp: 'Just now',
        isSystem: true
      });
    });
    
    socket.on('send_message', async (data) => {
      console.log('Received message:', data);
      console.log('Socket ID:', socket.id);
      console.log('Connected users:', Array.from(connectedUsers.keys()));
      
      const user = connectedUsers.get(socket.id);
      if (!user) {
        console.log('❌ User not found for socket:', socket.id);
        console.log('Total registered users:', connectedUsers.size);
        socket.emit('error', 'You must enter your name before chatting. Please refresh the page.');
        return;
      }
      
      console.log(`Message from ${user.username}:`, data.message);
      
      const now = Date.now();
      const lastMessageTime = userLastMessage.get(socket.id) || 0;
      
      if (now - lastMessageTime < MESSAGE_COOLDOWN) {
        const remainingTime = Math.ceil((MESSAGE_COOLDOWN - (now - lastMessageTime)) / 1000);
        console.log('Rate limit hit for:', user.username);
        socket.emit('rate_limit', `Slow down! You can send another message in ${remainingTime} seconds.`);
        return;
      }
      
      const message = data.message.trim();
      
      if (isSpam(message)) {
        console.log('Spam detected from:', user.username);
        socket.emit('spam_detected', 'Message detected as spam and deleted.');
        return;
      }
      
      if (message.length > 200) {
        console.log(`Message too long from ${user.username}: ${message.length} characters`);
        socket.emit('error', `Message too long! Maximum 200 characters (you sent ${message.length}).`);
        return;
      }
      
      userLastMessage.set(socket.id, now);
      
      const userMsg = {
        id: generateUniqueId(),
        user: user.username,
        message: message,
        timestamp: 'Just now',
        isYou: false,
        userColor: user.color || '#8b5cf6'
      };
      
      console.log('Broadcasting message:', userMsg);
      io.emit('message', userMsg);
      
      io.emit('chat_message_recorded', userMsg);
      
      const questionCheck = isQuestion(message);
      console.log(`Is question: ${questionCheck.isQuestion} (target: ${questionCheck.target}) - "${message}"`);
      
      if (questionCheck.isQuestion) {
        questions.push({
          id: now,
          username: user.username,
          question: message,
          timestamp: new Date().toISOString()
        });
        
        conversationQueue.push({
          username: user.username,
          question: message,
          target: questionCheck.target,
          timestamp: now
        });
        
        console.log('✅ Question added to queue! Queue length:', conversationQueue.length);
        
        // Get dynamic guest name from broadcast state
        const { broadcastState } = await import('../routes/admin.js');
        const guestName = (broadcastState.isCustomGuest && broadcastState.guestData) 
          ? broadcastState.guestData.memeName 
          : 'Pepe';
        
        let targetName;
        if (questionCheck.target === 'guest' || questionCheck.target === 'pepe') {
          targetName = guestName;
        } else if (questionCheck.target === 'host' || questionCheck.target === 'mrcock') {
          targetName = 'Mr. Cock';
        } else {
          targetName = `Mr Cock and ${guestName}`;
        }
        
        let ackMessage = `Question for ${targetName} from ${user.username} added to the show! They'll answer it shortly.`;
        
        io.emit('get_broadcast_state');
        
        io.emit('message', {
          id: generateUniqueId(),
          user: 'System',
          message: ackMessage,
          timestamp: 'Just now',
          isSystem: true
        });
      } else {
        console.log('Not a question, just chat');
      }
    });
    
    socket.on('disconnect', () => {
      connectedUsers.delete(socket.id);
      userLastMessage.delete(socket.id);
      
      const displayCount = connectedUsers.size + 17;
      io.emit('user_count', displayCount);
      
      console.log('User disconnected:', socket.id);
    });
  });
}

