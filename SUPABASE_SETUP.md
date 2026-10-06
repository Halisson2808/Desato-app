# Desato App — Banco Supabase

Projeto informado pelo usuário: `szvxlhubtvhazlzohpse`.
URL: `https://szvxlhubtvhazlzohpse.supabase.co`.

## Estado em 06/10/2026

- CLI inicializada localmente e dependências de desenvolvimento instaladas.
- Migração pronta em `supabase/migrations/20261006000100_desato_initial.sql`.
- Oito testes SQL passaram em PostgreSQL embarcado (PGlite), incluindo isolamento real por RLS, validação e exclusão em cascata.
- **Não aplicado remotamente:** a sessão salva na CLI não tem permissão para o projeto solicitado. `supabase link --project-ref szvxlhubtvhazlzohpse` foi recusado por falta de privilégios.
- Nenhum projeto remoto foi alterado e nenhum histórico local foi enviado.
- O aplicativo continua usando JSON. Criar o esquema não conecta automaticamente o frontend nem implementa login. A integração com sessões autenticadas será a próxima etapa, após confirmar a criação das tabelas.

A chave publishable fornecida foi registrada em `.env.supabase.example`, como configuração pública para a futura integração. Esse arquivo não é carregado automaticamente e não contém senha ou chave administrativa.

## Estrutura

| Tabela | Finalidade |
| --- | --- |
| `desato_profiles` | Nome, e-mail de perfil, objetivo e data de início |
| `desato_money` | Gasto médio e frequência de saídas |
| `desato_checkins` | Registro diário e anotação |
| `desato_routine_tasks` | Hábitos e períodos |
| `desato_routine_completions` | Conclusões por tarefa e dia |
| `desato_hydration` | Copos por dia |
| `desato_groceries` | Lista de compras |
| `desato_sos_sessions` | Sessões SOS |
| `desato_support_plans` | Plano de Apoio |
| `desato_support_favorites` | Guias favoritos |
| `desato_recipe_favorites` | Reserva para favoritos de receitas |
| `desato_quiz_answers` | Respostas versionadas do quiz futuro |

Todas as tabelas usam `user_id` ligado a `auth.users`. RLS limita leitura, inclusão, edição e exclusão ao proprietário autenticado. A chave publishable sozinha não dá acesso aos registros. A relação composta da rotina impede completar uma tarefa de outra conta. A exclusão da conta remove seus dados por cascata.

Cadastros futuros recebem perfil, cálculo zerado e seis hábitos iniciais, sem check-ins, economia ou respostas inventadas. A migração não cria usuários Auth, não preenche dados de contas existentes e não importa o arquivo JSON. O e-mail do perfil é um campo de contato; ele não substitui nem altera o e-mail de autenticação.

As tabelas têm prefixo `desato_` para separar esta estrutura de outros recursos do projeto. Não há tabela ou campo que permita ao cliente se declarar assinante; pagamentos serão definidos separadamente.

## Opção A — SQL Editor

1. Entre no painel do projeto correto com uma conta que tenha permissão de edição.
2. Abra SQL Editor e uma consulta nova.
3. Cole e execute o conteúdo completo de `supabase/migrations/20261006000100_desato_initial.sql` **uma única vez**.
4. Execute `supabase/verify.sql` e confira a mensagem de verificação.

O script contém uma transação. Se algum nome já existir ou ocorrer erro, não contém DROP nem apaga tabelas; examine o erro antes de tentar de novo. O script não é uma migração idempotente para execução repetida.

## Opção B — CLI

Node.js 20+ é necessário para a CLI. O aplicativo local permanece compatível com Node.js 18+.

Na pasta do projeto, use sua própria conta autorizada:

```powershell
npm run db:login
npm run db:link
npm run db:push -- --dry-run
npm run db:push
```

`npm run db:login` usa `--no-browser`: não abre automaticamente o navegador padrão. Mantenha o terminal aberto, copie o link novo completo e abra no navegador em que você usa a conta com acesso ao projeto. Não reutilize um link de uma tentativa encerrada.

Se aparecer “Could not create CLI login session”, a sessão de login não foi criada pelo Supabase; a mensagem sozinha não determina a causa. Como alternativa oficial, entre na conta correta pelo navegador de sua escolha e use um Personal Access Token pelo fluxo de login por token da CLI. O token deve ser inserido somente no seu terminal, nunca no chat ou no Git. Referência: https://supabase.com/docs/guides/platform/personal-access-tokens

A CLI pode solicitar a senha do banco no terminal. Não cole senha, token pessoal ou `service_role` no chat ou em arquivos públicos. A URL com `[YOUR-PASSWORD]` é um modelo, não uma conexão utilizável.

`supabase init` já foi executado; não precisa repetir nem usar `--force`.

Se aplicar pelo SQL Editor primeiro e depois adotar a CLI, sincronize o histórico da migração antes de usar `db push`; não tente criar as mesmas tabelas novamente.

## Testes e dependências

```powershell
npm run db:test
npm test
```

Os testes de banco usam PostgreSQL em memória e duas identidades fictícias. Eles não se conectam ao Supabase remoto nem leem o histórico pessoal. Supabase CLI e PGlite são dependências de desenvolvimento. Para instalar os testes em outra máquina, use `npm ci`; para rodar apenas o aplicativo local, continuam desnecessárias dependências de produção.

## Próxima etapa de integração

Depois da criação remota: configurar login, enviar tokens de sessão nas chamadas, validar identidade no servidor e trocar cada rota de persistência por consultas das tabelas correspondentes. Não usar a chave publishable como autenticação de usuário nem colocar chave administrativa no navegador. A migração de dados pessoais existentes precisa de uma conta destinatária confirmada.

Referências técnicas: [CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) e [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
