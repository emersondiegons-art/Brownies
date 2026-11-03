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
// 2. PEDIDO: CARRINHO + DATA/HORÁRIO DE RETIRADA
// ==========================================

const orderForm = document.getElementById('form-encomenda');

if (orderForm) {
    const selectSabor = document.getElementById('sabor');
    const inputQtd = document.getElementById('quantidade');
    const btnAdicionar = document.getElementById('btn-adicionar');
    const listaCarrinho = document.getElementById('carrinho-lista');
    const msgVazio = document.getElementById('carrinho-vazio');
    const totalEl = document.getElementById('carrinho-total');
    const erroCarrinho = document.getElementById('carrinho-erro');
    const campoPedido = document.getElementById('pedido-json');
    const inputData = document.getElementById('retirada');
    const inputHora = document.getElementById('hora');
    const erroData = document.getElementById('erro-retirada');
    const erroHora = document.getElementById('erro-hora');

    const MAX_UNIDADES = 50;
    const TEXTO_DATA = 'Escolha a data de retirada.';
    const TEXTO_HORA = 'Escolha um horário entre 10h e 19h.';

    // Cada item: { nome, preco, qtd }
    const carrinho = [];

    const moeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const totalUnidades = () => carrinho.reduce((soma, item) => soma + item.qtd, 0);
    const totalPreco = () => carrinho.reduce((soma, item) => soma + item.qtd * item.preco, 0);

    // ---------- Data mínima: hoje ----------
    function formatarData(d) {
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${mes}-${dia}`;
    }
    inputData.min = formatarData(new Date());

    // ---------- Mensagens de erro do carrinho ----------
    function mostrarErroCarrinho(texto) {
        erroCarrinho.textContent = texto;
        erroCarrinho.classList.add('visivel');
    }

    function esconderErroCarrinho() {
        erroCarrinho.textContent = '';
        erroCarrinho.classList.remove('visivel');
    }

    // ---------- Validação da retirada (domingo, 48h, horário que já passou) ----------
    function marcarErro(campo, elementoErro, mensagem) {
        campo.setCustomValidity(mensagem);
        elementoErro.textContent = mensagem;
    }

    function validarRetirada() {
        inputData.setCustomValidity('');
        inputHora.setCustomValidity('');
        erroData.textContent = TEXTO_DATA;
        erroHora.textContent = TEXTO_HORA;

        if (!inputData.value) return;

        const [ano, mes, dia] = inputData.value.split('-').map(Number);
        const data = new Date(ano, mes - 1, dia);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const diasAte = Math.round((data - hoje) / 86400000);

        if (data.getDay() === 0) {
            marcarErro(inputData, erroData, 'Não abrimos aos domingos. Escolha de segunda a sábado.');
            return;
        }

        if (totalUnidades() > 12 && diasAte < 2) {
            marcarErro(inputData, erroData, 'Pedidos com mais de 12 unidades precisam de 48 horas de antecedência.');
            return;
        }

        if (inputHora.value && diasAte === 0) {
            const [h, m] = inputHora.value.split(':').map(Number);
            const agora = new Date();
            if (h * 60 + m <= agora.getHours() * 60 + agora.getMinutes()) {
                marcarErro(inputHora, erroHora, 'Esse horário já passou. Escolha um horário mais tarde.');
            }
        }
    }

    inputData.addEventListener('input', validarRetirada);
    inputHora.addEventListener('input', validarRetirada);

    // ---------- Desenha o carrinho na tela ----------
    function criarBotao(texto, acao, nome, rotulo) {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.textContent = texto;
        botao.dataset.acao = acao;
        botao.dataset.nome = nome;
        botao.setAttribute('aria-label', rotulo);
        return botao;
    }

    function renderizar() {
        listaCarrinho.replaceChildren();

        carrinho.forEach((item) => {
            const li = document.createElement('li');
            li.className = 'carrinho-item';

            const info = document.createElement('div');
            info.className = 'carrinho-info';
            const nome = document.createElement('strong');
            nome.textContent = item.nome;
            const detalhe = document.createElement('span');
            detalhe.textContent = `${item.qtd} x ${moeda(item.preco)} = ${moeda(item.qtd * item.preco)}`;
            info.append(nome, detalhe);

            const acoes = document.createElement('div');
            acoes.className = 'carrinho-acoes';
            acoes.append(
                criarBotao('−', 'menos', item.nome, `Diminuir ${item.nome}`),
                criarBotao('+', 'mais', item.nome, `Aumentar ${item.nome}`),
                criarBotao('Remover', 'remover', item.nome, `Remover ${item.nome}`)
            );

            li.append(info, acoes);
            listaCarrinho.appendChild(li);
        });

        msgVazio.hidden = carrinho.length > 0;
        totalEl.textContent = moeda(totalPreco());
        campoPedido.value = JSON.stringify(carrinho); // pronto para enviar a um servidor no futuro
        validarRetirada(); // a regra das 48h depende da quantidade total
    }

    // ---------- Adicionar sabor ----------
    function adicionar() {
        const nome = selectSabor.value;
        const qtd = parseInt(inputQtd.value, 10);

        if (!nome) {
            mostrarErroCarrinho('Escolha um sabor para adicionar.');
            selectSabor.focus();
            return;
        }
        if (!Number.isInteger(qtd) || qtd < 1) {
            mostrarErroCarrinho('Informe uma quantidade de 1 ou mais.');
            inputQtd.focus();
            return;
        }
        if (totalUnidades() + qtd > MAX_UNIDADES) {
            mostrarErroCarrinho(`O máximo é ${MAX_UNIDADES} unidades por pedido. Para mais, fale com a gente pelo WhatsApp.`);
            return;
        }

        const preco = Number(selectSabor.selectedOptions[0].dataset.preco);
        const existente = carrinho.find((item) => item.nome === nome);

        if (existente) {
            existente.qtd += qtd; // mesmo sabor: soma na quantidade
        } else {
            carrinho.push({ nome, preco, qtd });
        }

        selectSabor.value = '';
        inputQtd.value = 1;
        esconderErroCarrinho();
        renderizar();
    }

    btnAdicionar.addEventListener('click', adicionar);

    // ---------- Botões −, + e Remover de cada item ----------
    listaCarrinho.addEventListener('click', (e) => {
        const botao = e.target.closest('button');
        if (!botao) return;

        const indice = carrinho.findIndex((item) => item.nome === botao.dataset.nome);
        if (indice === -1) return;

        const item = carrinho[indice];

        if (botao.dataset.acao === 'mais') {
            if (totalUnidades() + 1 > MAX_UNIDADES) {
                mostrarErroCarrinho(`O máximo é ${MAX_UNIDADES} unidades por pedido.`);
                return;
            }
            item.qtd += 1;
        } else if (botao.dataset.acao === 'menos') {
            item.qtd -= 1;
            if (item.qtd === 0) carrinho.splice(indice, 1);
        } else if (botao.dataset.acao === 'remover') {
            carrinho.splice(indice, 1);
        }

        esconderErroCarrinho();
        renderizar();
    });

    // ---------- Botão "Encomendar" dos cards já escolhe o sabor ----------
    document.querySelectorAll('.card .btn-pequeno').forEach((botao) => {
        botao.addEventListener('click', () => {
            const nome = botao.closest('.card').querySelector('h3').textContent.trim();
            const existe = [...selectSabor.options].some((opcao) => opcao.value === nome);
            if (existe) selectSabor.value = nome;
        });
    });

    // ---------- Envio do pedido ----------
    // (o navegador já validou nome, e-mail, telefone, data e horário antes deste código)
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (carrinho.length === 0) {
            mostrarErroCarrinho('Adicione pelo menos um sabor ao pedido.');
            selectSabor.focus();
            return;
        }

        const itens = carrinho.map((item) => `${item.qtd}x ${item.nome}`).join(', ');
        const [ano, mes, dia] = inputData.value.split('-');

        alert(
            'Obrigado pelo seu pedido de brownie!\n\n' +
            `Pedido: ${itens}\n` +
            `Total: ${moeda(totalPreco())}\n` +
            `Retirada: ${dia}/${mes}/${ano} às ${inputHora.value}\n\n` +
            'Entraremos em contato em breve.'
        );

        orderForm.reset();
        carrinho.length = 0;
        esconderErroCarrinho();
        renderizar();
    });

    renderizar();
}
