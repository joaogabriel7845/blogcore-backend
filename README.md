# BlogCore — Back-end

API REST do BlogCore, uma aplicação de blog/rede social em estilo Instagram, com cadastro de usuários, autenticação, posts e perfis.

## Tecnologias

- Node.js
- Fastify
- PostgreSQL
- JWT (autenticação)
- bcrypt (hash de senhas)
- Cloudinary (upload de imagens)

## Funcionalidades

- Cadastro e login de usuários
- Autenticação via JWT
- Criação de posts
- Upload e edição de foto de perfil
- Edição de bio
- Visualização de perfil de outros usuários

## Como rodar localmente

1. Clone o repositório:
   ```
   git clone https://github.com/joaogabriel7845/blogcore-backend.git
   cd blogcore-backend
   ```
2. Instale as dependências:
   ```
   npm install
   ```
3. Crie um arquivo `.env` com as variáveis necessárias (banco de dados, JWT secret, credenciais do Cloudinary).
4. Rode o servidor:
   ```
   npm start
   ```

## Deploy

API publicada no Render: https://blogcore-backend.onrender.com

## Projeto em evolução

Este projeto está em desenvolvimento ativo, com novas funcionalidades sendo adicionadas continuamente.
