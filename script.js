// ==========================================
// 1. LÓGICA DO CHATBOT (ABRIR, FECHAR E ENVIAR)
// ==========================================

const chatContainer = document.getElementById('chat-container');
const openChatBtn = document.getElementById('open-chat-btn');
const closeChatBtn = document.getElementById('close-chat-btn');
const sendMsgBtn = document.getElementById('send-msg-btn');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');

// Abrir e Fechar Janela do Chat
if (openChatBtn && closeChatBtn) {
    openChatBtn.addEventListener('click', () => {
        chatContainer.style.display = 'flex';
    });

    closeChatBtn.addEventListener('click', () => {
        chatContainer.style.display = 'none';
    });
}

// Função para adicionar mensagem na tela
function appendMessage(sender, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
    messageElement.innerText = text;
    chatMessages.appendChild(messageElement);
    
    // Rola para a mensagem mais recente
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Evento de Envio de Mensagem
sendMsgBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMessage();
});

async function handleSendMessage() {
    const messageText = userInput.value.trim();
    if (!messageText) return;

    // 1. Exibe a mensagem do usuário
    appendMessage('user', messageText);
    userInput.value = '';

    // 2. Resposta temporária de teste (mock) enquanto não conecta a API
    appendMessage('bot', 'Hummm, brownie delicioso! Em breve estarei conectado à IA para te ajudar melhor!');
}

// ==========================================
// 2. INTERATIVIDADE DO SITE (MENU E FORMULÁRIO)
// ==========================================

// Captura de envio do formulário de contato/pedido
const orderForm = document.getElementById('order-form');
if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Obrigado pelo seu pedido de brownie! Entraremos em contato em breve.');
        orderForm.reset();
    });
}