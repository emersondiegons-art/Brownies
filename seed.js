// popula o banco com dados fictícios de demonstração
// uso: npm run seed
import db from './db.js';

const PRODUTOS = [
    {
        nome: 'Tradicional de Brigadeiro',
        preco: 7,
        descricao: 'Chocolate 50% com miolo cremoso e casquinha crocante.',
        cor: '#3a1a0f',
        topo: null,
        selo: 'Mais pedido'
    },
    {
        nome: 'Ninho',
        preco: 7,
        descricao: 'Massa de chocolate com camadas de creme de leite Ninho.',
        cor: '#f8f3c6',
        topo: null,
        selo: null
    },
    {
        nome: 'Doce de Leite',
        preco: 7,
        descricao: 'Brownie de Doce de Leite clássico.',
        cor: '#ba8a43',
        topo: null,
        selo: null
    },
    {
        nome: 'Maracujá',
        preco: 7,
        descricao: 'Recheio de redução de maracujá natural.',
        cor: null,
        topo: 'maracuja',
        selo: null
    },
    {
        nome: 'Goiabada',
        preco: 7,
        descricao: 'Goiabada cremosa e artesanal.',
        cor: '#c90f1f',
        topo: null,
        selo: 'Artesanal'
    },
    {
        nome: 'Caixa MENU DEGUSTAÇÃO',
        preco: 40,
        descricao: 'Um de cada sabor do cardápio, em caixa para presente.',
        cor: null,
        topo: 'caixa-degustacao',
        selo: 'Para presentear'
    }
];

const CLIENTES = [
    'Ana Clara Souza', 'Bruno Ferreira', 'Camila Rocha', 'Diego Almeida',
    'Elisa Martins', 'Felipe Nunes', 'Gabriela Lima', 'Henrique Costa',
    'Isabela Prado', 'João Pedro Ramos'
];

const DOMINIOS = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com.br'];

const OBSERVACOES = [
    '',
    '',
    '',
    'Sem nozes, por favor.',
    'Mensagem no cartão: Feliz aniversário!',
    'Retirar depois das 15h.'
];

const aleatorio = (lista) => lista[Math.floor(Math.random() * lista.length)];
const inteiro = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function semAcento(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function formatarData(data) {
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${data.getFullYear()}-${mes}-${dia}`;
}

function dataDeRetirada() {
    const data = new Date();
    data.setDate(data.getDate() + inteiro(-20, 10));
    if (data.getDay() === 0) data.setDate(data.getDate() + 1); // domingo a loja fecha
    return formatarData(data);
}

const totalProdutos = db.prepare('SELECT COUNT(*) AS total FROM produtos').get().total;

if (totalProdutos > 0) {
    console.log('O banco já tem produtos. Nada foi inserido.');
    process.exit(0);
}

const inserirProduto = db.prepare(`
    INSERT INTO produtos (nome, preco, descricao, cor, topo, selo)
    VALUES (?, ?, ?, ?, ?, ?)
`);
const inserirCliente = db.prepare(`
    INSERT INTO clientes (nome, email, telefone)
    VALUES (?, ?, ?)
`);
const inserirPedido = db.prepare(`
    INSERT INTO pedidos (cliente_id, data_retirada, hora, obs, total, status)
    VALUES (?, ?, ?, ?, ?, ?)
`);
const inserirItem = db.prepare(`
    INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
    VALUES (?, ?, ?, ?)
`);

const criarDados = db.transaction(() => {
    const produtos = PRODUTOS.map((produto) => {
        const info = inserirProduto.run(
            produto.nome,
            produto.preco,
            produto.descricao,
            produto.cor,
            produto.topo,
            produto.selo
        );
        return { id: Number(info.lastInsertRowid), preco: produto.preco };
    });

    const clientes = CLIENTES.map((nome) => {
        const email = `${semAcento(nome).replace(/\s+/g, '.')}@${aleatorio(DOMINIOS)}`;
        const telefone = `(86) 9${inteiro(1000, 9999)}-${inteiro(1000, 9999)}`;
        return Number(inserirCliente.run(nome, email, telefone).lastInsertRowid);
    });

    const hoje = formatarData(new Date());

    for (let i = 0; i < 25; i++) {
        const escolhidos = [...produtos].sort(() => Math.random() - 0.5).slice(0, inteiro(1, 3));
        const itens = escolhidos.map((produto) => ({ ...produto, qtd: inteiro(1, 6) }));
        const total = itens.reduce((soma, item) => soma + item.preco * item.qtd, 0);
        const retirada = dataDeRetirada();

        const pedido = inserirPedido.run(
            aleatorio(clientes),
            retirada,
            `${String(inteiro(10, 18)).padStart(2, '0')}:00`,
            aleatorio(OBSERVACOES),
            total,
            retirada < hoje ? 'entregue' : 'novo'
        );

        for (const item of itens) {
            inserirItem.run(pedido.lastInsertRowid, item.id, item.qtd, item.preco);
        }
    }
});

criarDados();

console.log(`${PRODUTOS.length} produtos, ${CLIENTES.length} clientes e 25 pedidos inseridos em melt.db.`);
