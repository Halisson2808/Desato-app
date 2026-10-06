# Desato App

Base funcional de um aplicativo web responsivo para acompanhamento diário de quem está mudando o consumo de álcool. O projeto funciona com **frontend + API Node + Supabase Auth e PostgreSQL**, com dados separados por conta. O servidor local usa apenas recursos nativos do Node; o SDK do navegador está empacotado no projeto.

> Marca definida: **Desato** na interface e **Desato App** nos títulos e metadados de descoberta. O planejamento do quiz está em [PLANEJAMENTO_QUIZ.md](PLANEJAMENTO_QUIZ.md).

## Rodar

No Windows, dê dois cliques em **Abrir aplicativo.bat**. Ele inicia o servidor e abre o navegador quando o aplicativo estiver pronto. Mantenha a janela do servidor aberta durante o uso; feche-a ou pressione Ctrl+C para encerrar. Se o aplicativo já estiver rodando na porta 4173, o arquivo abre a instância existente.

Requisito: Node.js 18+.

```bash
npm start
```

Abra:

```text
http://localhost:4173
```

Não é necessário `npm install`.

## Layout responsivo

- **Desktop/web:** sidebar fixa à esquerda, header completo e conteúdo aproveitando a largura da tela.
- **Celular:** navegação inferior com 5 botões.
- **Tablet:** layout fluido sem ficar preso em uma moldura estreita de celular.

## As 5 abas

1. **Início** — registro diário, sequência, progresso do mês, dinheiro economizado, calculadora de gastos, evolução e resumo da rotina.
2. **Rotina** — hábitos de manhã/tarde/noite, conclusão diária, criação, edição, pausa e exclusão de hábitos.
3. **SOS** — fluxo único de 5 passos. Sem menu de ferramentas e sem cronômetro: respirar, movimentar o corpo, mudar o ambiente, ocupar a mente e escolher a próxima ação.
4. **Alimentação** — refeições simples, hidratação, receitas e lista de compras.
5. **Apoio** — guias por situação, favoritos e um plano pessoal para momentos difíceis.

**Perfil** fica acessível pelo avatar do header, com dados pessoais e objetivo.

## Calculadora de economia

O usuário informa:

- quanto normalmente gasta em cada saída para beber;
- quantas vezes por semana normalmente sai.

O aplicativo calcula:

- gasto semanal;
- gasto mensal médio (`semana × 52 / 12`);
- gasto anual;
- economia estimada acumulada em função dos dias registrados sem consumo.

Tudo aparece no Início.

## Persistência atual

Por padrão, os dados são salvos nas tabelas `desato_*` do Supabase com a sessão autenticada. Cada rota valida a identidade no Supabase e opera somente sobre os registros desse usuário, com RLS no banco. Não há fallback automático para JSON se a conexão falhar.

O arquivo local antigo continua preservado em:

```text
data/store.json
```

O frontend conversa com `/api/*`. Para desenvolvimento e testes isolados, `STORAGE_MODE=json` mantém o armazenamento antigo, somente em endereço local.

## Estrutura

```text
companheiro-recuperacao/
├─ server.js
├─ package.json
├─ data/
│  └─ store.json
├─ public/
│  ├─ index.html
│  ├─ styles.css
│  ├─ manifest.webmanifest
│  ├─ sw.js
│  ├─ icon.svg
│  └─ js/
│     ├─ app.js
│     ├─ api.js
│     ├─ utils.js
│     └─ views/
│        ├─ home.js
│        ├─ routine.js
│        ├─ sos.js
│        ├─ food.js
│        └─ profile.js
└─ CODEX_HANDOFF.md
```

## API usada pelo frontend

- `GET /api/state`
- `GET /api/summary`
- `PUT /api/profile`
- `PUT /api/money`
- `POST /api/checkin`
- `POST /api/hydration`
- `POST /api/sos-session`
- `POST /api/groceries`
- `PATCH /api/groceries/:id`
- `DELETE /api/groceries/:id`
- `POST /api/routine/tasks`
- `PATCH /api/routine/tasks/:id`
- `DELETE /api/routine/tasks/:id`
- `POST /api/routine/complete`
- `GET /api/support`
- `PUT /api/support/plan`
- `PATCH /api/support/favorites/:id`

## Observação

O SOS é uma ferramenta de apoio visual e comportamental do MVP, não um protocolo médico. Há apenas um aviso curto para procurar atendimento em caso de sintomas físicos intensos ou emergência.

## Melhorias e verificação

Use `npm test` para executar os testes de integração da API. Os testes usam um diretório temporário e não modificam `data/store.json`.

O Início agora permite consultar anotações e corrigir dias passados pelo botão **Histórico**, na seção Sua evolução. As abas internas de Alimentação e Rotina permanecem selecionadas após salvar.

Novas instalações começam sem registros e sem gastos fictícios. O arquivo existente é preservado. Não use os dados de exemplo distribuídos como histórico pessoal sem revisá-los.

A persistência grava por arquivo temporário e renomeação; `store.json.bak` contém a versão imediatamente anterior. Um arquivo corrompido é preservado e causa erro, sem redefinição silenciosa. Para recuperar, pare o servidor, preserve o arquivo inválido e restaure uma cópia válida.

`HOST` (padrão `127.0.0.1`), `PORT` e `DATA_DIR` podem ser definidos no ambiente do processo. `.env.example` é apenas referência; não é carregado automaticamente. Use uma única instância do servidor por diretório de dados.

O cache guarda a interface, incluindo as cinco telas. Os dados e salvamentos dependem do servidor. Se os dados não carregarem, o SOS ainda pode ser aberto; a conclusão informa quando não consegue registrar a sessão.

Esta base continua local e para um usuário. Banco, autenticação, isolamento por usuário, cobrança e publicação estão detalhados em `ANALISE_DO_APLICATIVO.md`.

## Aba Apoio

A aba **Apoio** está implementada no lugar de Perfil na navegação. Ela oferece seis situações, nove guias no total, favoritos e um plano pessoal editável. Perfil permanece acessível pelo avatar do header. Detalhes em [PLANEJAMENTO_APOIO.md](PLANEJAMENTO_APOIO.md).

Na primeira leitura de arquivos antigos, a API adiciona `support` e atualiza a versão do armazenamento para 3, preservando os campos existentes e salvando o arquivo anterior em `.bak`. Planos e favoritos precisam de conexão com o servidor; os guias também fazem parte do cache da interface.

## Se a interface ficar em branco após uma atualização

Feche a janela do servidor, abra novamente `Abrir aplicativo.bat` e recarregue a página com Ctrl+F5. Reabrir o BAT enquanto o servidor antigo continua ativo apenas reutiliza a instância existente.

Os guias de Apoio usam `.js`, servido como JavaScript inclusive por versões anteriores do servidor. Isso evita o bloqueio da interface causado por servidores antigos que entregavam `.mjs` como `application/octet-stream`.

## Banco Supabase criado

A migração do Desato com 12 tabelas e isolamento por usuário está em `supabase/migrations/20261006000100_desato_initial.sql`. Os testes SQL estão disponíveis com `npm run db:test`. A migração foi aplicada ao projeto `szvxlhubtvhazlzohpse`; as 12 tabelas, regras RLS e trigger de cadastro foram verificadas remotamente. O aplicativo já usa Supabase por padrão e oferece login, cadastro, recuperação, sessão persistente e logout. Consulte [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

## Repositório

Código e migrações: [Halisson2808/Desato-app](https://github.com/Halisson2808/Desato-app). Dados pessoais em `data/`, arquivos de ambiente privados, cache e dependências não são enviados ao GitHub.

## Login e conta

Abra o aplicativo normalmente pelo BAT. Entre com e-mail e senha ou use **Criar conta**. O Supabase está configurado para confirmar o e-mail antes do primeiro acesso. **Esqueci a senha** envia o link de recuperação; abra esse link no mesmo navegador em que o solicitou (fluxo PKCE). O Perfil permite solicitar a alteração de e-mail, redefinir senha e sair.

O Desato não salva senha em JSON, banco próprio, código ou localStorage. O navegador pode oferecer seu gerenciador de senhas pelos atributos de preenchimento automático. O SDK oficial mantém e renova a sessão; o e-mail pode ser lembrado pela opção do formulário. Dados carregados e modais são limpos ao sair ou trocar de conta.

URL e chave pública estão em `config/supabase.json`, com substituição opcional por `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` no ambiente do processo. Somente chave publishable é aceita; nenhuma chave administrativa é necessária para o aplicativo. `GET /api/config` expõe exclusivamente configuração pública. `GET /api/health` permite ao BAT aguardar o servidor sem acessar dados pessoais.

O usuário confirmou as URLs `http://127.0.0.1:4173` e `http://localhost:4173` na configuração de redirecionamento do Supabase. Quando publicar, adicione o domínio real. A entrega de confirmação e recuperação depende do serviço de e-mail/SMTP do Supabase; não foi enviado e-mail de teste a pessoas nesta implementação.

O histórico local antigo não foi enviado nem atribuído a nenhuma conta automaticamente. A primeira conta começa com seus próprios registros no banco.

Para reempacotar o SDK após alterar suas dependências: `npm run build:auth` (após `npm ci`). O arquivo gerado é servido localmente e está incluído no cache da interface. Os testes cobrem a tela pelo DOM, sem abrir navegador.
