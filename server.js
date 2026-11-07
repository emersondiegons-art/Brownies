import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// carrega as variáveis do arquivo .env (chave do Gemini, porta, etc)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// permite receber JSON no corpo das requisições
app.use(express.json());
// serve os arquivos do site (index.html, css, js) direto da pasta do projeto
app.use(express.static('.'));

// ollama roda local no computador, o gemini fica de reserva
const OLLAMA_URL = 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = 'llama3.1:8b';

// só cria o cliente do Gemini se tiver chave no .env
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

// se não tiver chave, o model fica undefined e o Gemini é pulado
const model = genAI?.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash'
});

// instruções que definem como a Mel se comporta e o que ela pode falar.
// os dados da loja ficam aqui pra IA não inventar nada
const SYSTEM_INSTRUCTION = `
Você é a Mel, assistente virtual da confeitaria MELT.

Seja simpática, educada e acolhedora. Responda sempre em português do Brasil,
de forma clara e objetiva.

CARDÁPIO:
- Tradicional de Brigadeiro: R$ 7,00
- Ninho: R$ 7,00
- Doce de Leite: R$ 7,00
- Maracujá: R$ 7,00
- Goiabada: R$ 7,00
- Caixa Menu Degustação: R$ 40,00
- Cada brownie pesa cerca de 112g

ENDEREÇO E FUNCIONAMENTO:
- Rua Oito, 3484 - Vale Quem Tem
- Segunda a sábado, das 10h às 19h
- Domingo: fechado

ENCOMENDAS:
- Pedidos acima de 12 unidades precisam de 48 horas de antecedência
- E-mail: browniemelt@gmail.com
- Pelo formulário do site ou pelo WhatsApp

REGRAS:
1. Use somente as informações acima.
2. Não invente sabores, preços, promoções ou condições, e não altere os preços.
3. Se não souber algo, diga que precisa confirmar.
4. Não responda perguntas que não tenham a ver com a MELT.
5. Não invente links nem números de WhatsApp.
6. Incentive o cliente a ver o cardápio e fazer encomendas.
7. Responda só o que foi perguntado, sem explicações longas.
8. Se lhe perguntarem sobre o peso do brownie, diga que pesa aproximadamente 112g.
9. Se lhe perguntarem sobre um professor chamado Martins, diga que o admira profundamente, mas não tem informações sobre ele.
`;

// pega só as últimas 10 mensagens do histórico (pra não estourar o contexto)
// e descarta qualquer item que não tenha o campo text em formato de string
function limparHistorico(history) {
    return history
        .slice(-10)
        .filter(msg => msg && typeof msg.text === 'string');
}

// tenta responder usando o Ollama (IA principal)
async function consultarOllama(message, history) {
    // monta a conversa: instrução do sistema + histórico + mensagem atual
    const mensagens = [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        // o front manda "sender", o Ollama espera "role"
        ...limparHistorico(history).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        })),
        { role: 'user', content: message }
    ];

    const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages: mensagens,
            // stream false = recebe a resposta completa de uma vez
            stream: false,
            // temperatura baixa deixa a resposta mais fiel ao cardápio
            options: { temperature: 0.2 }
        }),
        // se o Ollama passar de 90s sem responder, cancela e vai pro Gemini
        signal: AbortSignal.timeout(90000)
    });

    if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();

    // garante que veio texto na resposta
    if (!data.message?.content) {
        throw new Error('O Ollama não retornou uma resposta.');
    }

    return data.message.content.trim();
}

// tenta responder usando o Gemini (IA reserva)
async function consultarGemini(message, history) {
    // sem chave configurada, nem tenta
    if (!model) {
        throw new Error('Gemini não configurado.');
    }

    const chat = model.startChat({
        // no Gemini o papel da IA se chama "model" e o texto vai dentro de parts
        history: limparHistorico(history).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        })),
        systemInstruction: SYSTEM_INSTRUCTION
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
}

// resposta pronta caso as duas IAs estejam fora do ar.
// procura palavras-chave na pergunta e devolve a informação certa
function respostaAutomatica(message) {
    // tira acentos e deixa tudo minúsculo pra facilitar a busca
    // (ex: "Preço" vira "preco")
    const pergunta = message
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    // cardápio e preços
    if (/sabor|cardapio|menu|preco|valor|quanto custa|brownie/.test(pergunta)) {
        return `Oi! 💛 Nosso cardápio MELT conta com:

🍫 Brigadeiro: R$ 7,00
🥛 Ninho: R$ 7,00
🍯 Doce de Leite: R$ 7,00
🥭 Maracujá: R$ 7,00
🍓 Goiabada: R$ 7,00

🎁 Caixa Menu Degustação: R$ 40,00

Cada brownie pesa aproximadamente 112g.`;
    }

    // endereço e horário
    if (/endereco|onde fica|localizacao|retirada|horario|funciona|abre|fecha/.test(pergunta)) {
        return `Oi! 💛 A MELT fica na Rua Oito, 3484 - Vale Quem Tem.

Funcionamos de segunda a sábado, das 10h às 19h.
Aos domingos não abrimos.`;
    }

    // encomendas e prazo
    if (/encomenda|pedido|pedir|prazo|antecedencia|reserv/.test(pergunta)) {
        return `Oi! 💛 Para fazer sua encomenda, use o formulário na seção de encomendas do site ou chame a gente pelo WhatsApp.

Pedidos acima de 12 unidades precisam de 48 horas de antecedência.`;
    }

    // peso do brownie
    if (/peso|grama|gramas|pesam/.test(pergunta)) {
        return 'Nossos brownies artesanais pesam aproximadamente 112g por unidade. 💛';
    }

    // não bateu com nenhuma palavra-chave
    return `Oi! 💛 Sou a Mel, assistente virtual da MELT.

No momento não consegui acessar a inteligência artificial, mas posso ajudar com sabores, preços, endereço e encomendas.

Obrigada pela compreensão! 🍫`;
}

// rota que o chat do site chama a cada mensagem do cliente.
// ordem de tentativa: Ollama -> Gemini -> resposta automática
app.post('/api/chat', async (req, res) => {
    const { message, history = [] } = req.body;

    // valida se a mensagem existe e não está vazia
    if (typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Mensagem não fornecida.' });
    }

    // se o histórico vier num formato estranho, usa uma lista vazia
    const historico = Array.isArray(history) ? history : [];

    // 1ª tentativa: Ollama
    try {
        const reply = await consultarOllama(message, historico);
        console.log('Resposta gerada pelo Ollama.');
        return res.json({ reply, provider: 'ollama' });
    } catch (erro) {
        // não devolve erro pro cliente, só registra e segue pro próximo
        console.error('Ollama falhou:', erro.message);
    }

    // 2ª tentativa: Gemini
    try {
        const reply = await consultarGemini(message, historico);
        console.log('Resposta gerada pelo Gemini.');
        return res.json({ reply, provider: 'gemini' });
    } catch (erro) {
        console.error('Gemini falhou:', erro.message);
    }

    // última opção: resposta pronta, assim o cliente nunca fica sem retorno
    console.log('Usando resposta automática.');
    return res.json({ reply: respostaAutomatica(message), provider: 'automatic' });
});

// sobe o servidor e mostra no terminal o que está configurado
app.listen(PORT, () => {
    console.log(`MELT rodando em http://localhost:${PORT}`);
    console.log(`Ollama: ${OLLAMA_MODEL} | Gemini: ${model ? 'configurado' : 'sem chave'}`);
});
