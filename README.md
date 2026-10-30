# MELT - Brownies Artesanais

Site de uma loja fictícia de brownies artesanais, feito com **HTML, CSS e JavaScript puro**. A página tem cardápio, formulário de encomenda com validação, seção de contato e uma janela flutuante de chat (assistente virtual).

Projeto desenvolvido para fins acadêmicos.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como executar](#como-executar)
- [Seções da página](#seções-da-página)
- [Identidade visual](#identidade-visual)
- [Responsividade](#responsividade)
- [Formulário de encomenda](#formulário-de-encomenda)
- [Chat (assistente virtual)](#chat-assistente-virtual)
- [Como personalizar](#como-personalizar)
- [Acessibilidade](#acessibilidade)
- [Melhorias futuras](#melhorias-futuras)
- [Autoria](#autoria)

---

## Funcionalidades

- Cabeçalho fixo com logo e menu de navegação com rolagem suave entre as seções.
- Seção inicial com o nome **MELT** sobre fotos de brownies que se alternam sozinhas (animação só com CSS).
- Cards de produtos organizados com **CSS Grid**.
- Formulário de encomenda com **validação em HTML e feedback visual em CSS**.
- Chat flutuante que abre e fecha **sem JavaScript** (checkbox + CSS).
- Layout adaptado para celular, tablet e computador.

## Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML5 | Estrutura e semântica da página |
| CSS3 | Layout (Grid e Flexbox), cores, animações e responsividade |
| JavaScript | Envio de mensagens no chat e confirmação do formulário |
| Google Fonts | Fonte da marca (Sniglet) e fontes de apoio |

## Estrutura de pastas

```
melt/
├── index.html      # estrutura da página
├── style.css       # todos os estilos
├── script.js       # chat e formulário
├── caixa.jpg       # imagem do card "Caixa MENU DEGUSTAÇÃO"
└── fotos/          # fotos do início (brownie-1.jpg ... brownie-4.jpg)
```

## Como executar

1. Baixe ou clone o projeto.
2. Mantenha todos os arquivos na mesma pasta, como mostrado acima.
3. Abra o `index.html` no navegador (duplo clique).

As fontes vêm do Google Fonts, então é preciso estar conectado à internet. Sem conexão, o navegador usa fontes de reserva.

## Seções da página

| Seção | Id | Conteúdo |
|---|---|---|
| Início | `#inicio` | Nome da marca, frase de apresentação, fotos que passam e botões de ação |
| Sobre | `#sobre` | História da loja e três diferenciais |
| Produtos | `#produtos` | Cards com os sabores e preços |
| Encomendas | `#encomendas` | Formulário de pedido |
| Contato | `#contato` | Endereço de retirada, horário, e-mail e WhatsApp |

### Cardápio

| Produto | Preço |
|---|---|
| Tradicional de Brigadeiro | R$ 7,00 |
| Ninho | R$ 7,00 |
| Doce de Leite | R$ 7,00 |
| Maracujá | R$ 7,00 |
| Goiabada | R$ 7,00 |
| Caixa MENU DEGUSTAÇÃO (um de cada sabor) | R$ 35,00 |

## Identidade visual

As cores ficam como variáveis no `:root` do `style.css`.

| Variável | Cor | Uso |
|---|---|---|
| `--cacau` | `#2a140c` | Fundo escuro, cabeçalho, texto |
| `--fudge` | `#4b2416` | Seção de encomendas |
| `--framboesa` | `#d9184f` | Botões e destaques |
| `--framboesa-escura` | `#b3123f` | Botões ao passar o mouse |
| `--blush` | `#fde7ec` | Fundo rosado e texto sobre fundo escuro |
| `--acucar` | `#fffaf8` | Fundo claro |

**Tipografia:** Sniglet (peso 800) para o nome MELT no logo e no título principal; as demais fontes são definidas nas variáveis `--fonte-titulo` e `--fonte-texto`.

**Detalhes feitos só com CSS:**

- Chocolate escorrendo na borda inferior da seção inicial (imagem SVG embutida no CSS).
- Pontinhos pretos do card de Maracujá, feitos com `radial-gradient`.
- Troca automática das fotos do início, com `@keyframes`.
- Indicador "digitando..." do chat.

## Responsividade

O layout usa `grid`, `flex` e `clamp()` para se ajustar à tela. Os pontos de quebra principais são:

- **até 860px:** as colunas das seções Sobre e Encomendas passam a ficar uma embaixo da outra.
- **até 640px:** o menu rola na horizontal, os campos do formulário ocupam a linha inteira e o chat abre quase em tela cheia.

A grade de produtos usa `repeat(auto-fit, minmax(260px, 1fr))`, então o número de colunas se ajusta sozinho.

## Formulário de encomenda

| Campo | Validação |
|---|---|
| Nome completo | obrigatório, de 3 a 60 caracteres |
| E-mail | obrigatório, formato de e-mail válido |
| Telefone / WhatsApp | obrigatório, com DDD (padrão definido por `pattern`) |
| Sabor | obrigatório, escolha na lista |
| Quantidade | obrigatória, entre 1 e 50 |
| Data de retirada | obrigatória |
| Observações | opcional, até 200 caracteres |
| Aceite | checkbox obrigatório |

O navegador bloqueia o envio enquanto houver campo inválido. Depois que a pessoa mexe no campo, ele fica **verde** (válido) ou **vermelho** com uma mensagem de erro (inválido), usando `:user-valid` e `:user-invalid`.

Ao enviar com tudo correto, o `script.js` mostra uma mensagem de agradecimento e limpa o formulário. **Os dados ainda não são enviados para nenhum servidor.**

## Chat (assistente virtual)

**Visual (HTML + CSS):** botão redondo no canto da tela que abre uma janela com topo, mensagens, sugestões rápidas e campo de texto. A janela abre e fecha com um checkbox escondido (`#chat-toggle`), sem JavaScript.

**Comportamento (`script.js`):** envia a mensagem digitada (botão ou Enter), mostra o indicador "digitando..." e exibe a resposta. Os botões de sugestão ("Ver cardápio", "Horário", "Como encomendar") enviam o próprio texto.

A resposta do assistente é uma **mensagem automática de teste**, igual para qualquer pergunta.

| Elemento | Id / classe |
|---|---|
| Caixa de mensagens | `#chat-mensagens` |
| Campo de texto | `#chat-input` |
| Botão de enviar | `#chat-enviar` |
| Mensagem do assistente | `.msg.bot` |
| Mensagem da pessoa | `.msg.usuario` |
| Indicador de digitação | `.msg.bot.digitando` |

## Como personalizar

- **Preços e sabores:** edite os cards na seção `#produtos` do `index.html` e as opções do campo "Sabor" no formulário.
- **Cores:** altere as variáveis no `:root` do `style.css`.
- **Fotos do início:** troque os arquivos da pasta `fotos/`. Para mudar a quantidade de fotos, ajuste o tempo da animação `passar-fotos` e os `animation-delay` no CSS.
- **Endereço, horário e contato:** edite a seção `#contato`.
- **Número do WhatsApp:** troque o link `https://wa.me/5586999999999` pelo número real, com código do país e DDD, sem espaços.

## Acessibilidade

- Estrutura semântica (`header`, `nav`, `main`, `section`, `footer`) e campos de formulário com `label`.
- Foco visível em links, botões e campos.
- Imagens decorativas marcadas com `aria-hidden` e `alt` vazio.
- Animações desativadas para quem pede menos movimento no sistema (`prefers-reduced-motion`).

## Melhorias futuras

- Enviar os pedidos do formulário para um banco de dados ou e-mail.
- Carrinho de compras e pagamento online.
- Painel para a loja gerenciar produtos e pedidos.

## Autoria

Projeto desenvolvido por Emerson, Maria Eugênia e Renata como atividade acadêmica.

Curso: Tecnólogo em Inteligência Artificial.
