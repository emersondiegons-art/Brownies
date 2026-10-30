// ==========================================
// 1. CHATBOT (ENVIAR MENSAGENS)
// Abrir e fechar a janela é feito só com CSS (checkbox #chat-toggle),
// então não precisa de JavaScript para isso.
// ==========================================

const chatMessages = document.getElementById('chat-mensagens');
const userInput = document.getElementById('chat-input');
const sendMsgBtn = document.getElementById('chat-enviar');

// Função para adicionar mensagem na tela
// sender: 'user' ou 'bot'
function appendMessage(sender, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('msg', sender === 'user' ? 'usuario' : 'bot');
    messageElement.textContent = text; // textContent: o que for digitado nunca vira HTML
    chatMessages.appendChild(messageElement);

    // Rola para a mensagem mais recente
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Mostra o "digitando..." e devolve o elemento para poder removê-lo depois
function showTyping() {
    const typing = document.createElement('div');
    typing.classList.add('msg', 'bot', 'digitando');
    typing.setAttribute('aria-label', 'Assistente digitando');
    typing.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typing;
}

async function handleSendMessage(text) {
    const messageText = (text ?? userInput.value).trim();
    if (!messageText) return;

    // 1. Exibe a mensagem do usuário
    appendMessage('user', messageText);
    userInput.value = '';

    // 2. Mostra o "digitando..." enquanto a resposta não chega
    const typing = showTyping();

    // 3. Resposta temporária de teste (mock) enquanto não conecta a API.
    // Quando a API estiver pronta, troque este trecho por uma chamada ao
    // seu servidor (por exemplo, fetch('/api/chat', ...)).
    // Nunca coloque a chave da API neste arquivo: qualquer visitante consegue ler.
    await new Promise((resolve) => setTimeout(resolve, 700));
    typing.remove();
    appendMessage('bot', 'Hummm, brownie delicioso! Em breve estarei conectado à IA para te ajudar melhor!');
}

// Eventos de envio
if (sendMsgBtn && userInput && chatMessages) {
    sendMsgBtn.addEventListener('click', () => handleSendMessage());

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Os botões de sugestão ("Ver cardápio", "Horário"...) enviam o próprio texto
    document.querySelectorAll('.chip').forEach((chip) => {
        chip.addEventListener('click', () => handleSendMessage(chip.textContent));
    });
}

// ==========================================
// 2. INTERATIVIDADE DO SITE (FORMULÁRIO)
// ==========================================

// Captura de envio do formulário de encomenda
// (o navegador já validou os campos antes deste código rodar)
const orderForm = document.getElementById('form-encomenda');
if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Obrigado pelo seu pedido de brownie! Entraremos em contato em breve.');
        orderForm.reset();
    });
}