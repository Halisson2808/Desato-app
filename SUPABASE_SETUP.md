# Desato App — Banco Supabase

Projeto informado pelo usuário: `szvxlhubtvhazlzohpse`.
URL: `https://szvxlhubtvhazlzohpse.supabase.co`.

## Estado em 06/10/2026

- CLI inicializada localmente e dependências de desenvolvimento instaladas.
- Migração pronta em `supabase/migrations/20261006000100_desato_initial.sql`.
- Oito testes SQL passaram em PostgreSQL embarcado (PGlite), incluindo isolamento real por RLS, validação e exclusão em cascata.
- **Aplicado remotamente:** após autenticar a conta correta, o vínculo ao projeto foi concluído e a migração `20261006000100` foi aplicada. O histórico local/remoto e `supabase/verify.sql` confirmaram 12 tabelas com RLS e trigger de cadastro.
- Apenas o projeto `szvxlhubtvhazlzohpse` recebeu a estrutura. Nenhum histórico local foi enviado.
- Integração concluída: o aplicativo usa Supabase Auth e as tabelas por conta por padrão. JSON permanece somente como modo explícito de desenvolvimento local. O histórico antigo não foi importado.

A chave publishable fornecida foi registrada em `.env.supabase.example`, como configuração pública para a futura integração. Esse arquivo é referência. A configuração pública usada pelo servidor está em `config/supabase.json`, podendo ser substituída por variáveis de ambiente. Nenhum dos dois contém senha ou chave administrativa.

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

## Instruções para uma instalação nova — SQL Editor

O projeto informado **já recebeu esta migração**. Não execute novamente o SQL inicial nele. As instruções abaixo servem para outra instalação vazia autorizada.

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

`supabase init`, o vínculo e a migração inicial já foram concluídos neste projeto; não precisa repetir nem usar `--force`. O comando `db push` passa a aplicar apenas futuras migrações pendentes.

Se aplicar pelo SQL Editor primeiro e depois adotar a CLI, sincronize o histórico da migração antes de usar `db push`; não tente criar as mesmas tabelas novamente.

## Testes e dependências

```powershell
npm run db:test
npm test
```

Os testes de banco usam PostgreSQL em memória e duas identidades fictícias. Eles não se conectam ao Supabase remoto nem leem o histórico pessoal. Supabase CLI e PGlite são dependências de desenvolvimento. Para instalar os testes em outra máquina, use `npm ci`; para rodar apenas o aplicativo local, continuam desnecessárias dependências de produção.

## Integração de autenticação concluída

Login, cadastro, confirmação de e-mail, recuperação, alteração de e-mail e saída estão conectados ao SDK oficial. A API verifica o bearer token em `/auth/v1/user`, lê e grava as tabelas com esse mesmo token e com filtro de proprietário. Não usa service_role. Cada alteração atua apenas na tabela/registro correspondente, sem regravar o estado completo da conta.

A sessão persistente é renovada pelo SDK. E-mail pode ser lembrado; senha não é persistida pelo Desato. A configuração remota pública confirmou cadastro por e-mail habilitado e confirmação obrigatória. O usuário informou que adicionou as duas URLs locais de redirecionamento. A CLI não tinha acesso à configuração de Auth; nenhuma configuração administrativa adicional foi sobrescrita.

O envio de e-mails de confirmação/recuperação depende da configuração de SMTP no projeto. Não houve cadastro de contas de teste em produção ou envio de mensagens a terceiros. O histórico JSON permanece local, sem importação automática para contas novas.


Referências técnicas: [CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) e [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
