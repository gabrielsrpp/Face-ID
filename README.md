# Face ID – Reconhecimento Facial Web


## Sobre o Projeto

Face ID é um sistema web de reconhecimento facial para cadastro, identificação e histórico de detecções de pessoas pela webcam do navegador. Utiliza Node.js, Express, MongoDB, e a biblioteca [face-api.js](https://github.com/justadudewhohacks/face-api.js) no frontend.

Ideal para demonstrações, controle de acesso e aprendizado sobre reconhecimento facial com JavaScript.

---

## Funcionalidades

- Cadastro de usuários com nome e foto capturada da webcam
- Reconhecimento facial em tempo real (webcam)
- Histórico de detecções com data, hora, nome e foto da detecção
- Visualização ampliada da imagem da detecção no histórico
- Limpeza rápida do histórico de detecções
- Edição e exclusão de usuários cadastrados
- Interface responsiva, tema claro/escuro

---

## Imagem do Sistema

<img width="1897" height="937" alt="image" src="https://github.com/user-attachments/assets/35164f3c-088a-46a8-8613-36efd25bba16" />


---

## Instalação

### 1. Pré-requisitos

- [Node.js](https://nodejs.org/) (v14+ recomendado)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (ou local)
- Uma webcam

### 2. Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/face-id.git
cd face-id
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```
MONGODB_URI=suaconexaomongodb
PORT=3000
```

> **Dica:** Para MongoDB Atlas, use a string de conexão fornecida no painel.

### 5. Rode o servidor

```bash
node server.js
# ou com:
npm start
# ou com nodemon:
nodemon server.js
```

O servidor rodará em [http://localhost:3000](http://localhost:3000).

---

## Uso

1. Acesse [http://localhost:3000](http://localhost:3000) no navegador.
2. Cadastre um usuário com a webcam.
3. Vá em “Reconhecer” e posicione-se para ser identificado.
4. Consulte o histórico em “Histórico”, clique na imagem para ampliar ou limpe o histórico conforme necessário.

---

## Estrutura do Projeto

```
face-id/
├── images/             # Imagens do sistema
├── scripts/
│   └── script.js       # Lógica do frontend
├── styles.css          # Estilos gerais
├── server.js           # Backend Node.js / Express
├── package.json
├── .env.example
└── README.md
```

---

## Tecnologias Utilizadas

- **Frontend:** HTML, CSS, JavaScript (face-api.js)
- **Backend:** Node.js, Express
- **Banco de Dados:** MongoDB (Mongoose)
- **Outros:** Font Awesome, CDN face-api.js

---

## É possivel mudar a porcentagem de reconhecimento atravez da linha:
```bash
const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.4); // atualmente em 0.4 ele detecta entre 60% para cima abaixo disto ele não reconhece |aqui fica a porcentagem que voce quer para detectção | 0.6	~50% | 0.5	~65% | 0.45	~75% | 0.4	~85%
// 0.45 para só reconhecer se for mais ou menos 70% ou mais. não é um calculo exato é geralmente o valor entre ou mais proximo.   
```
