# Gestor de Finanças – Guia para Validação dos Requisitos

Este guia reúne os passos que o avaliador deve seguir para comprovar os requisitos técnicos e criativos definidos para o projeto.

## 🛠️ Preparação do ambiente

```bash
# instalar dependências
npm install

# iniciar o app em modo desenvolvimento (Expo)
npm run dev
```

Com o Metro rodando, abra o Expo Go (ou um simulador) e carregue o projeto. Todas as telas citadas abaixo ficam disponíveis na barra inferior de abas.

---

## ✅ Requisito 1 — Stack técnica completa 

### 1.1 Componentes, bibliotecas e integrações 

1. Abra qualquer tela (por exemplo, **Dashboard**) e observe o uso extensivo de componentes nativos do React Native: `View`, `Text`, `ScrollView`, `FlatList`, `Modal`, `TouchableOpacity`, `RefreshControl`, `ActivityIndicator`, `Alert`, `Animated`, entre outros (ver `src/features/**/*`).
2. Confirme o uso das bibliotecas exigidas:
   - **React Navigation / Expo Router** (`app/(tabs)/_layout.tsx`) para múltiplas telas.
   - **React Hook Form** + **Yup** (`react-hook-form`, `@hookform/resolvers/yup`, `yup`) nos formulários, ex.: `src/features/rendas/screens/RendaFormScreen.tsx`.
   - **Máscaras de input** com `react-native-mask-text`, encapsuladas em `src/components/InputMask.tsx`.
   - **Ícones** com `lucide-react-native`, **gráficos** com `react-native-chart-kit`, **gradientes** com `expo-linear-gradient`, etc.
   - **AsyncStorage** para persistência local em `src/services/api.ts` e `src/store/slices/authSlice.ts`.
   - **Comunicação com API local** via o helper de `src/services/api.ts`, que abstrai Create/Read/Update/Delete usando AsyncStorage como banco local.

### 1.2 Cinco CRUDs completos com entradas variadas 

Para cada módulo abaixo, percorra a sequência **Listar → Criar → Editar → Excluir**. Todos utilizam pelo menos 5 campos e tipos variados (texto, números, máscaras, seletores, switches ou pickers):

| CRUD | Tela de listagem | Tela de formulário | Campos de destaque |
|------|------------------|--------------------|---------------------|
| Rendas | `app/(tabs)/rendas/index.tsx` → `RendasListScreen` | `app/(tabs)/rendas/form.tsx` → `RendaFormScreen` | Descrição, Valor (máscara), Tipo (Picker), Datas (máscara), Categoria, Conta |
| Despesas | `app/(tabs)/despesas.tsx` → `DespesasScreen` | Modal interno em **Despesas** | Título, Valor (máscara), Categoria, Conta, Data, Parcelamento |
| Metas | `app/(tabs)/metas.tsx` → `MetasScreen` | Modal interno em **Metas** | Nome, Valor alvo, Valor atual, Prazo, Status (Picker) |
| Categorias | `app/(tabs)/configuracoes.tsx` → `ConfiguracoesScreen` (seção Categorias) | Modal de Categoria | Nome, Tipo (Picker), Cor (ColorPicker), Observações |
| Contas | `ConfiguracoesScreen` (seção Contas) | Modal de Conta | Nome, Tipo, Observações, Saldo inicial automático |
| Usuários | `ConfiguracoesScreen` (seção Usuários) | Modal de Usuário | Nome, E-mail, Tipo de acesso (Picker), Status (Picker) |

> **Dica:** Todos os formulários exibem mensagens de validação em tempo real graças ao React Hook Form + Yup. Experimente enviar campos vazios para ver os avisos obrigatórios.

### 1.3 Tela diferenciada 

- A aba **Dashboard** (`src/features/dashboard/screens/DashboardScreen.tsx`) apresenta visualização avançada de dados:
  - Gráficos de pizza (`react-native-chart-kit`) com cores dinâmicas.
  - Cartões de estatísticas com `expo-linear-gradient` e animações (`Animated`).
  - Filtro por intervalo de datas com inputs mascarados.
  - Toggle de tema claro/escuro animado.

---

## 🎨 Requisito 2 — Criatividade e Interface 

Passeie por todas as abas e observe:
- Paleta de cores adaptável ao tema claro/escuro (controle no Dashboard).
- Cartões reutilizáveis (`src/components/Card.tsx`), botões customizados (`src/components/Button.tsx`), entradas mascaradas, seletores personalizados (`src/components/Picker.tsx`).
- Animações sutis ao trocar de tema e ao exibir painéis, garantindo experiência consistente.
- Navegação em abas (`app/(tabs)/_layout.tsx`) simples e intuitiva, com agrupamento de rotas seguindo boas práticas do Expo Router.

> Personalizações extras: color-picker para categorias, alertas contextuais, prompts automáticos para cadastro de contas antes de lançamentos, modais com design consistente e responsivo.

---

## 🧠 Bastidores técnicos para explicar durante a avaliação

### Armazenamento & API local
- **AsyncStorage como banco:** `src/services/api.ts` implementa helpers (`list`, `create`, `update`, `remove`) que guardam os dados em chaves `db:<coleção>` do AsyncStorage. Cada slice Redux consome essa camada para manter o estado sincronizado.
- **Seed automático:** as seeds de rendas e despesas são marcadas via flags no AsyncStorage (`incomeSeed:<userId>`), garantindo que cada usuário receba dados iniciais apenas uma vez.
- **Persistência de sessão:** `src/store/slices/authSlice.ts` salva o usuário autenticado em `SESSION_KEY`, permitindo login automático quando o app é reaberto.

### Fluxo de autenticação
- Tela de login localizada em `app/login.tsx` (ou route equivalente via Expo Router).
- Ações Redux `signIn`, `signOut` e `restoreSession` orquestram login, logout e resgate da sessão, com feedback visual via `Loading` e `Alert`.
- Após `signIn`, o usuário é redirecionado para `/(tabs)`; ao fazer logout na tela de Configurações, o estado limpa o AsyncStorage e volta ao login.

### Componentes reutilizáveis
- **Form inputs customizados:** `InputMask`, `Picker`, `ColorPicker` e `Button` encapsulam estilos, estados de erro e integração com o tema, acelerando a criação de formulários complexos.
- **Layout consistente:** `Card` e `Loading` mantêm padrões visuais em todo o app. A arquitetura em `src/features/<domínio>/screens` facilita reuso e manutenção.

### Animações e microinterações
- **Tema com transição animada** (`DashboardScreen`): usa `Animated.timing` para opacidade/escala ao trocar de modo claro/escuro.
- **Feedbacks visuais**: loaders `ActivityIndicator`, alertas condicionais e motion nos cartões do Dashboard criam sensação de fluidez.

### Tema dinâmico
- **Contexto de tema** (`src/contexts/ThemeContext.tsx`): expõe `colors`, `isDark` e `toggleTheme`, persistindo a escolha no AsyncStorage para manter o modo selecionado.
- **Hook `useTheme`** aplicado em todo componente chave, garantindo aderência automática ao tema ao renderizar textos, inputs e cards.
- **Dashboard** oferece o botão de toggle, demonstrando rapidamente a diferença entre temas para a banca.

---

## 📋 Resumo rápido para a apresentação

1. **Abrir o Dashboard** → mostrar gráficos, filtros com máscara e animação de tema.
2. **Acessar cada aba de CRUD (Rendas, Despesas, Metas, Configurações)** → criar, editar e excluir ao menos um item, destacando validações.
3. **Comentar sobre a stack** → citar bibliotecas instaladas (`package.json`), uso de AsyncStorage e arquitetura em `src/features`.
4. **Finalizar** ressaltando a coerência visual e as interações suaves.

Com este roteiro, todos os requisitos podem ser demonstrados em sequência durante a avaliação. Bons testes! 🙌
