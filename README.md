# Aplicativo de Entregas para Office Boy

## Funcionalidades
- Cadastro de clientes e documentos
- Priorização de entregas urgentes
- Visualização em tempo real das rotas
- Painel de controle para o entregador

## Como Executar

### Pré-requisitos
- Node.js (v18 ou superior)
- NPM (v9 ou superior)

### Instalação
1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor:
```bash
npm start
```

3. Acesse as interfaces:
- Cadastro de clientes: http://localhost:8000/public/index.html
- Painel do entregador: http://localhost:8000/public/dashboard.html

## Estrutura do Projeto
```
├── public/            # Frontend
│   ├── index.html     # Página de cadastro
│   └── dashboard.html # Painel do entregador
├── scripts/           # Lógica do frontend
│   ├── main.js        # Formulário de cadastro
│   └── dashboard.js   # Painel de entregas
├── server/            # Backend
│   ├── server.js      # API e WebSocket
│   └── orders.json    # Banco de dados temporário
```

## Próximos Passos
- Integração com API do Google Maps
- Autenticação de usuários
- Notificações em tempo real
- Relatórios de entregas