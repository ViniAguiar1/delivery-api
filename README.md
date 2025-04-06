
# Delivery API - Backend

API desenvolvida em **Node.js** para gerenciar um sistema de delivery com suporte a múltiplos tipos de usuários (cliente, empresa, desenvolvimento), integração com JSON local como base de dados e documentação via **Swagger**.

---

## 🚀 Funcionalidades

- Autenticação com JWT
- Gerenciamento de usuários com permissões (`cliente`, `empresa`, `desenvolvimento`)
- CRUD completo para:
  - Empresas e produtos
  - Categorias
  - Endereços
  - Métodos de pagamento
  - Carrinho e pedidos
  - Cupons e cupons do usuário
  - Avaliações de empresas e usuários
  - Notificações (manuais e automáticas)
  - Funcionários (motoboy, atendente, etc)
  - Estoque
- Sistema de recomendações
- Sistema de repetição de pedidos
- Permissões e bloqueios entre empresa e usuário
- Painel de dashboard para empresas com métricas

---

## 📁 Estrutura de Pastas

```
/db
  data.json         # Base de dados local
/middleware
  auth.js           # Middleware de autenticação JWT
/routes
  *.js              # Arquivos de rotas por funcionalidade
/swagger
  swagger.json      # Documentação completa da API
```

---

## 📦 Requisitos

- Node.js 16+
- npm ou yarn

---

## ⚙️ Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/delivery-api.git

# Entre na pasta do projeto
cd delivery-api

# Instale as dependências
npm install
```

---

## ▶️ Executando o Servidor

```bash
npm start
```

Servidor disponível em: [http://localhost:3000](http://localhost:3000)

---

## 📌 Prefixo das rotas

Todas as rotas iniciam com `/api`, exemplo:

- `POST /api/auth/login`
- `GET /api/products`
- `PATCH /api/users/:id`
- `POST /api/orders`
- `GET /api/dashboard/overview`

---

## 🔐 Autenticação com JWT

Algumas rotas exigem autenticação.

Header de requisição:

```
Authorization: Bearer <seu_token>
```

O token é retornado após login via `POST /api/auth/login`.

---

## 📖 Documentação Swagger

Acesse a documentação completa via Swagger em:

```
http://localhost:3000/api-docs
```

Inclui todos os endpoints com exemplos de requisição e resposta.

---

## 🗂 Estrutura inicial do `data.json`

```json
{
  "users": [],
  "products": [],
  "categories": [],
  "companies": [],
  "favorites": [],
  "coupons": [],
  "userCoupons": [],
  "addresses": [],
  "orders": [],
  "notifications": [],
  "paymentMethods": [],
  "carts": [],
  "reviews": [],
  "notificationSettings": [],
  "staff": [],
  "dashboardMetrics": {
    "totalPedidos": 0,
    "totalUsuarios": 0,
    "totalEmpresas": 0,
    "totalProdutos": 0
  }
}
```

---

## 📌 Observações

- As permissões (`cliente`, `empresa`, `desenvolvimento`) controlam o acesso a funcionalidades específicas.
- Empresas podem atribuir pedidos a entregadores cadastrados.
- Empresas podem bloquear usuários por má conduta.
- O sistema de estoque atualiza automaticamente ao aceitar pedidos.
- Usuários podem configurar preferências de notificação.
- O painel de métricas da empresa mostra pedidos, notas, total entregue e cancelado.

---

## ✨ Melhorias Futuras

- Integração com serviços de push notification (ex: Firebase)
- Pagamento online (Stripe, Mercado Pago)
- Upload de imagens com CDN
- Relatórios exportáveis (CSV/PDF)
- Permissões avançadas para staff (admin vs. atendente)
- Logs de ações administrativas
- Notificações com som e vibração (respeitando preferências do usuário)

---

## 🛠️ Comandos úteis

```bash
# Instalar dependências
npm install

# Rodar localmente
npm start
```

---

## 📄 Licença

Projeto de uso privado e acadêmico. Adapte livremente conforme sua necessidade.

---

Desenvolvido com organização, foco e flexibilidade para escalar ✌️
