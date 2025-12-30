# 📘 Pokédex – Vanilla JavaScript

Este projeto é uma **Pokédex interativa** desenvolvida como desafio técnico para Front-End, utilizando **Vanilla JavaScript**, seguindo o layout fornecido no Figma e consumindo dados da **PokéAPI**.

O objetivo foi demonstrar **organização de código**, **boas práticas**, **performance** e **interatividade**, sem o uso de frameworks como React ou Vue.

---

## 🚀 Funcionalidades

- 📋 **Listagem de Pokémon**
  - Dados consumidos da PokéAPI
  - Exibição paginada com **18 Pokémon por página**

- 🔍 **Busca dinâmica**
  - Busca por nome (parcial, conforme o usuário digita)
  - Busca por ID (exemplo: `#25`)
  - Busca por tipo (exemplo: `veneno`, `fogo`, `água`)

- 📄 **Paginação**
  - Navegação entre páginas sem recarregar a página
  - Controle de estado da página atual

- 📱 **Responsividade**
  - Layout adaptado para mobile, tablet e desktop
  - Grid responsivo conforme o Figma (até 6 colunas no desktop)

- ⚡ **Performance**
  - Cache em memória utilizando `Map`
  - Debounce na busca
  - Evita reprocessamento desnecessário ao trocar apenas a página

---

## 🛠 Tecnologias Utilizadas

- **Vanilla JavaScript (ES Modules)**
- **Vite** (bundler e servidor de desenvolvimento)
- **HTML5**
- **CSS3 (Grid e Media Queries)**
- **PokéAPI** – https://pokeapi.co

---

## 📂 Estrutura do Projeto

src/
├─ api/
│ └─ pokeApi.js # Camada de comunicação com a API
├─ assets/
│ └─ images/
├─ styles/
│ ├─ reset.css
│ └─ main.css
├─ main.js # Lógica principal da aplicação
index.html
.env.example

## ⚙️ Configuração e Execução

### 1️⃣ Clonar o repositório
- git clone <url-do-repositorio>
- cd pokedex-vanilla

### 2️⃣ Instalar dependências
- npm install

### 3️⃣ Configurar variáveis de ambiente
- Crie um arquivo .env a partir do .env.example:
 - cp .env.example .env

### 4️⃣ Executar o projeto
- npm run dev

- Acesse no navegador:
 - http://localhost:5173



### Decisões Técnicas
- Vite foi escolhido por ser uma ferramenta leve e rápida, ideal para projetos sem framework.

- Vanilla JavaScript foi utilizado para atender ao requisito do desafio e demonstrar domínio de manipulação de DOM e estado.

- Cache em memória para evitar requisições repetidas à API e melhorar performance.

- Debounce na busca para reduzir chamadas desnecessárias enquanto o usuário digita.

- Separação de responsabilidades:
 - pokeApi.js: comunicação com a API e normalização de dados
 - main.js: controle de estado, eventos e renderização da UI

### Possíveis Melhorias Futuras
- Modal com detalhes do Pokémon
- Criar um loading com layout melhor
- Criar pagina para Pokédex
- Filtros avançados por tipo
- Testes automatizados
- Deploy em ambiente público

### Autor
- Desenvolvido por José Henrique
- Desafio técnico – Front-End
