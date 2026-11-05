
import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('.'));

// ==========================================
// 1. CONFIGURAÇÃO DAS IAS
// ==========================================

// Ollama - IA principal
const OLLAMA_URL = 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = 'llama3.1:8b';

// Gemini - IA reserva
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const model = genAI?.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash'
});

// ==========================================
// 2. PERSONALIDADE DA MEL
// ==========================================

const SYSTEM_INSTRUCTION = `
Você é a Mel, assistente virtual oficial da confeitaria MELT.

PERSONALIDADE:
Seja simpática, acolhedora, educada e entusiasta de doces.
Responda sempre em português brasileiro.
Seja clara, natural e objetiva.

INFORMAÇÕES OFICIAIS DA MELT:

CARDÁPIO:
- Tradicional de Brigadeiro: R$ 7,00.
- Ninho: R$ 7,00.
- Doce de Leite: R$ 7,00.
- Maracujá: R$ 7,00.
- Goiabada: R$ 7,00.
- Caixa Menu Degustação: R$ 40,00.
- Peso unitário: aproximadamente 112g.

ENDEREÇO E FUNCIONAMENTO:
- Rua Oito, 3484 - Vale Quem Tem.
- Segunda a sábado, das 10h às 19h.
- Domingo: fechado.

ENCOMENDAS:
- Pedidos acima de 12 unidades exigem 48 horas de antecedência.
- E-mail: browniemelt@gmail.com.
- Encomendas pelo formulário do site ou WhatsApp.

REGRAS OBRIGATÓRIAS:
1. Utilize somente as informações oficiais acima.
2. Nunca invente sabores, preços, promoções ou condições.
3. Não altere os preços informados.
4. Se não souber uma informação, diga educadamente que precisa confirmá-la.
5. Não responda perguntas fora do contexto da MELT.
6. Não invente links ou números de WhatsApp.
7. Incentive o cliente a consultar o cardápio e fazer encomendas.
8.Evite explicações longas. Responda apenas o que o cliente perguntou.
9. Use linguagem simples, simpática e natural.
`;

// ==========================================
// 3. IA PRINCIPAL - OLLAMA
// ==========================================

async function consultarOllama(message, history) {

    const mensagens = [
        {
            role: 'system',
            content: SYSTEM_INSTRUCTION
        },
        ...history
            .slice(-10)
            .filter(msg => msg && typeof msg.text === 'string')
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            })),
        {
            role: 'user',
            content: message
        }
    ];

    const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages: mensagens,
            stream: false,
            options: {
                temperature: 0.2
            }
        }),
        signal: AbortSignal.timeout(90000)
    });

    if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();

    if (!data.message?.content) {
        throw new Error('O Ollama não retornou uma resposta.');
    }

    return data.message.content.trim();
}

// ==========================================
// 4. IA RESERVA - GEMINI
// ==========================================

async function consultarGemini(message, history) {

    if (!model) {
        throw new Error('Gemini não configurado.');
    }

    const formattedHistory = history
        .slice(-10)
        .filter(msg => msg && typeof msg.text === 'string')
        .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

    const chat = model.startChat({
        history: formattedHistory,
        systemInstruction: SYSTEM_INSTRUCTION
    });

    const result = await chat.sendMessage(message);

    return result.response.text();
}

// ==========================================
// 5. RESPOSTAS AUTOMÁTICAS
// ==========================================

function respostaAutomatica(message) {

    const pergunta = message
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    if (/sabor|cardapio|menu|preco|valor|quanto custa|brownie/.test(pergunta)) {

        return `Oi! 💛 Nosso cardápio MELT conta com:

🍫 Brigadeiro: R$ 7,00
🥛 Ninho: R$ 7,00
🍯 Doce de Leite: R$ 7,00
🥭 Maracujá: R$ 7,00
🍓 Goiabada: R$ 7,00

🎁 Caixa Menu Degustação: R$ 40,00.

Cada brownie pesa aproximadamente 112g.`;
    }

    if (/endereco|onde fica|localizacao|retirada|horario|funciona|abre|fecha/.test(pergunta)) {

        return `Oi! 💛 A MELT fica na Rua Oito, 3484 - Vale Quem Tem.

Funcionamos de segunda a sábado, das 10h às 19h.
Aos domingos não abrimos.`;
    }

    if (/encomenda|pedido|pedir|prazo|antecedencia|reserv/.test(pergunta)) {

        return `Oi! 💛 Para fazer sua encomenda, utilize o formulário na seção de encomendas do site ou entre em contato pelo WhatsApp.

Pedidos acima de 12 unidades precisam de 48 horas de antecedência.`;
    }

    if (/peso|grama|gramas|pesam/.test(pergunta)) {

        return 'Nossos brownies artesanais pesam aproximadamente 112g por unidade. 💛';
    }

    return `Oi! 💛 Sou a Mel, assistente virtual da MELT.

No momento, não consegui acessar nossa inteligência artificial.

Posso ajudar com informações sobre sabores, preços, endereço e encomendas.

Agradecemos sua compreensão! 🍫`;
}

// ==========================================
// 6. ROTA PRINCIPAL DO CHATBOT
// ==========================================

app.post('/api/chat', async (req, res) => {

    const { message, history = [] } = req.body;

    if (typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({
            error: 'Mensagem não fornecida.'
        });
    }

    const historicoSeguro = Array.isArray(history) ? history : [];

    // Primeira tentativa: Ollama
    try {

        const resposta = await consultarOllama(
            message,
            historicoSeguro
        );

        console.log('Resposta gerada pelo Ollama.');

        return res.json({
            reply: resposta,
            provider: 'ollama'
        });

    } catch (ollamaError) {

        console.error('Ollama falhou:', ollamaError.message);
    }

    // Segunda tentativa: Gemini
    try {

        const resposta = await consultarGemini(
            message,
            historicoSeguro
        );

        console.log('Resposta gerada pelo Gemini.');

        return res.json({
            reply: resposta,
            provider: 'gemini'
        });

    } catch (geminiError) {

        console.error('Gemini falhou:', geminiError.message);
    }

    // Última alternativa: atendimento automático
    console.log('Atendimento automático ativado.');

    return res.json({
        reply: respostaAutomatica(message),
        provider: 'automatic'
    });

});

// ==========================================
// 7. INICIALIZAÇÃO DO SERVIDOR
// ==========================================

app.listen(PORT, () => {

    console.log('================================');
    console.log('MELT - SERVIDOR INICIADO');
    console.log('Ollama:', OLLAMA_MODEL);
    console.log('Gemini:', model ? 'Configurado' : 'Sem chave');
    console.log('OpenAI: Removida');
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log('================================');

});
