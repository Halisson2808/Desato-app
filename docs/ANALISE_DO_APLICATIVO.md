# Análise do aplicativo — 01/10/2026

## Resultado

O projeto é um MVP local de acompanhamento do consumo de álcool, com cinco áreas, SPA em JavaScript e API Node sem dependências. A estrutura existente é adequada para desenvolver e validar o produto. Ainda não é uma aplicação pública com contas independentes.

Foram lidos o servidor, todos os módulos do frontend, HTML, CSS, manifesto, service worker, configuração, dados existentes e documentos de entrega. Os documentos foram tratados como contexto e propostas anteriores; não como autorização para contratar serviços, cobrar usuários ou publicar.

## Arquitetura e fluxo de dados

- `public/index.html`: estrutura de navegação, conteúdo, modais e mensagens.
- `public/js/app.js`: rotas, carregamento de estado, modais, navegação e gravações.
- `public/js/api.js`: cliente HTTP das rotas REST.
- `public/js/utils.js`: datas, formatos, seletores e escape de HTML.
- `public/js/views/`: Início, Rotina, SOS, Alimentação e Perfil.
- `public/styles.css`: interface móvel, tablet e desktop. Há estilos antigos e sobrescritas posteriores; a limpeza pode ser feita separadamente com comparação visual.
- `public/sw.js` e manifesto: cache da interface e metadados de instalação.
- `server.js`: arquivos estáticos, validação, regras de progresso e persistência local.
- `data/store.json`: um único conjunto compartilhado de dados. O arquivo distribuído possui perfil e registros de exemplo.

O frontend grava uma ação na API e recarrega o estado consolidado. Após a leitura do corpo da requisição, o servidor lê e altera o arquivo sem esperas assíncronas entre leitura e escrita. Isso evita a perda causada por duas requisições que antes liam a mesma versão antes de aguardar seus corpos.

## Avaliação das cinco áreas

| Área | O que funciona | Correções / complementos realizados |
| --- | --- | --- |
| Início | Registro diário, sequência, mês, economia, evolução e rotina | Histórico com edição de dias e anotações; percentual calculado sobre os dias realmente registrados; distinção de cores no gráfico; sequência descrita corretamente; próximas conquistas após 365 dias |
| Rotina | Criação, edição, pausa, exclusão e conclusão | Período selecionado permanece após salvar; botões indicam estado e nome do hábito |
| SOS | Cinco passos lineares com voltar e concluir | Conclusão aguarda tentativa de registro e informa falha; pode abrir mesmo quando o carregamento inicial dos dados falha |
| Alimentação | Sugestões, receitas, água e compras | Aba selecionada permanece após salvar; quantidade de água validada conforme os oito copos exibidos; controles de compras identificados |
| Perfil | Dados pessoais e objetivo | Validação de nome, e-mail e data; limite dos textos; escape do nome e das iniciais; campos dos modais ligados aos rótulos |

O Perfil permanece simples. O SOS continua linear. Sidebar e navegação móvel foram preservadas.

## Falhas corrigidas

1. **Perda de alterações simultâneas:** leitura do arquivo ocorre depois de receber o corpo. IDs usam UUID em vez de milissegundos.
2. **Sobrescrita silenciosa de arquivo inválido:** o original é preservado; o servidor sinaliza erro. Não recria histórico em caso de corrupção.
3. **Gravação direta vulnerável a arquivo parcialmente escrito:** gravação em temporário, renomeação e cópia da versão anterior em `.bak`.
4. **Dados fictícios em uma instalação nova:** o padrão inicia sem histórico, sem gasto inventado e sem e-mail de exemplo. O arquivo já existente não foi alterado.
5. **HTML inserido por nome do perfil:** cabeçalho e iniciais recebem escape.
6. **Entradas inválidas:** datas inexistentes ou futuras, status desconhecido, números não finitos, copos fracionários, booleanos falsos em formato de texto e JSON inválido recebem rejeição.
7. **Propriedades arbitrárias no perfil:** apenas os campos permitidos são atualizados.
8. **Rotas antigas fora do produto atual:** removidos reset, exportação, motivos e contato de confiança da API. Reset podia apagar os dados sem interface ou proteção.
9. **Chamadas de outra origem:** escritas com cabeçalho Origin externo são rejeitadas. O servidor escuta apenas em `127.0.0.1` por padrão.
10. **Envios duplicados na interface:** gravações bloqueiam temporariamente os botões e impedem uma segunda mutação em andamento.
11. **Erro após salvar confundido com falha de gravação:** mensagem distingue salvamento concluído de falha ao atualizar a tela.
12. **Modais com foco solto e eventos acumulados:** foco restrito ao diálogo, limpeza de Escape e restauração do foco ao fechar.
13. **Dados de ontem em página aberta:** recarregamento ao mudar o dia e ao recuperar a conexão.
14. **PWA incompleta:** cache inclui os cinco módulos de telas e o manifesto; caches antigos do aplicativo são removidos; recursos ausentes não recebem HTML como substituto de JavaScript.
15. **Cache de desenvolvimento atrasando mudanças:** arquivos estáticos usam revalidação, sem os cinco minutos anteriores de cache fresco.
16. **Barra móvel desalinhada em parte das larguras:** navegação inferior fixada em todas as larguras abaixo de 900px.
17. **Movimento e textos longos:** respeito à preferência de movimento reduzido e quebra de textos em áreas relevantes.
18. **Corpos grandes:** limite por bytes com resposta 413, mantendo o servidor disponível.

## Verificação

`npm test`: 10 testes de integração aprovados, usando diretório temporário. Cobertura: instalação vazia, perfil, entradas inválidas, economia, sequência, 20 gravações concorrentes, ciclo de rotina, hidratação/compras/SOS, rotas e origem, limite de payload e preservação de arquivo corrompido.

Antes da orientação para trabalhar apenas no código, foram conferidos no navegador: manter Lista ao adicionar compras, manter Noite ao concluir hábito e salvar/consultar uma anotação de dia anterior. Isso não equivale a uma auditoria visual completa de dispositivos, acessibilidade ou comportamento sem conexão. Depois dessa orientação, a verificação ficou restrita ao código e ao terminal.

A sintaxe do servidor, dos testes, do service worker e de todos os módulos do frontend também foi verificada.

Os testes não modificam `data/store.json`. A conferência da interface usou armazenamento temporário separado.

## Pendências reais para produção

| Prioridade | Pendência | O que precisa ser definido / implementado |
| --- | --- | --- |
| Alta | Banco e migração | Escolher armazenamento, definir esquema, migração do JSON, transações e recuperação. Uma única instância por arquivo permanece necessária |
| Alta | Autenticação | Cadastro, login, sessões, recuperação e tratamento de credenciais |
| Alta | Separação por usuário | Vincular e autorizar todos os registros por usuário no servidor e no banco; testar ausência de acesso cruzado |
| Alta | Operação pública | Hospedagem, HTTPS, segredos, logs sem conteúdo pessoal, backup periódico e teste de restauração |
| Alta | Política dos dados | Definir retenção, exclusão e consentimento adequados ao produto; revisão especializada antes da publicação |
| Média | Primeiro acesso | Trocar os exemplos distribuídos por um fluxo de configuração de perfil e cálculo, após definir a migração dos usuários existentes |
| Média | Pagamentos | Definir planos, preços, provedor, webhooks idempotentes e regras de acesso; nenhuma cobrança foi integrada |
| Média | Trabalho sem conexão | Definir se haverá leitura privada local ou fila de gravações. Atualmente há cache da interface, sem sincronização offline dos dados |
| Média | Acessibilidade completa | Contraste, leitores de tela, teclado, tamanho dos alvos, estados das abas e revisão responsiva por dispositivo |
| Média | Conteúdo de apoio | Revisão do conteúdo por profissionais apropriados e definição de público e limites do produto |
| Baixa | Marca | Escolher nome definitivo e aplicar no frontend, manifesto e título |
| Baixa | Limpeza técnica | Reduzir CSS duplicado, separar módulos do servidor e definir estratégia para históricos extensos |

## Limites atuais

- A proteção por origem e o endereço local não substituem autenticação. Quem tem acesso autorizado à máquina/servidor pode acessar o único conjunto de dados.
- JSON e backup `.bak` permanecem em texto legível. A cópia anterior não é backup externo, criptografia, histórico de versões ou garantia de recuperação após falha de disco.
- A gravação atômica não fornece coordenação entre processos nem durabilidade equivalente a um banco transacional.
- As datas usam o fuso local do processo. Antes de hospedar, deve-se definir como lidar com o fuso de cada usuário.
- Validação cobre campos escritos pela API; não há migração geral ou saneamento profundo de todas as versões históricas do arquivo.
- Campos de receitas favoritas existem no armazenamento, mas não possuem fluxo visível. Não foram tratados como funcionalidade prometida.
- O nome provisório foi mantido e não foi criado um plano comercial por inferência.

## Próxima etapa recomendada

Definir o destino de hospedagem e o provedor de autenticação/banco, implementar contas e isolamento dos dados, migrar o armazenamento existente e testar autorização. Pagamentos devem vir depois dessa base e da definição dos planos. Até lá, a aplicação corrigida pode ser usada e validada localmente.

## Atualização de planejamento — 01/10/2026

O usuário definiu a marca **Desato**, com **Desato App** para descoberta. A pendência de escolha do nome indicada na análise original foi resolvida. O bloco financeiro do quiz futuro foi registrado em `PLANEJAMENTO_QUIZ.md`, incluindo duas perguntas, projeção visual e assinatura de cerca de R$ 20 como hipótese ainda não finalizada.

## Aba Apoio implementada — 01/10/2026

A navegação principal agora é Início, Rotina, SOS, Alimentação e Apoio. Perfil permanece acessível pelo avatar. Apoio inclui seis situações práticas, nove guias com ações, favoritos, leitura dedicada e plano pessoal editável. A migração adiciona `support` ao armazenamento antigo, preservando os demais dados e criando backup antes de gravar.

Verificação desta etapa: **19 testes aprovados** em `npm test`, incluindo persistência e validação do plano, favoritos concorrentes, migração, preservação de arquivo inválido, renderização de guias, escape de textos pessoais e disponibilidade dos guias quando os dados não carregam. Não foi aberto navegador nem realizada nova auditoria visual. O conteúdo consiste em sugestões práticas de organização e comunicação; não foram adicionados protocolos clínicos.

## Banco Supabase preparado — 06/10/2026

Criada a migração `supabase/migrations/20261006000100_desato_initial.sql`, com 12 tabelas por usuário, políticas RLS, validação e rotina inicial no cadastro. Oito testes PostgreSQL locais passaram, verificando isolamento, bloqueio anônimo, chaves compostas e exclusão em cascata. Detalhes em `SUPABASE_SETUP.md`.

O Supabase recusou o vínculo ao projeto `szvxlhubtvhazlzohpse` por falta de privilégios das credenciais salvas na CLI. Nenhum SQL foi aplicado remotamente. O aplicativo continua usando JSON; login e adaptação das rotas permanecem como próximas etapas após a criação das tabelas.

## Banco Supabase aplicado — 06/10/2026

Após o usuário concluir o login da CLI, o projeto `szvxlhubtvhazlzohpse` foi vinculado. A migração `20261006000100_desato_initial.sql` foi aplicada, e o histórico remoto confirma a versão `20261006000100`. A consulta `supabase/verify.sql` confirmou as 12 tabelas protegidas por RLS e a trigger de cadastro. Nenhum histórico local foi importado. A pendência de acesso administrativo anterior foi resolvida; a adaptação do aplicativo e o login de usuários permanecem como próximas etapas.

## Login e persistência por conta — 06/10/2026

Implementados login, cadastro, confirmação, recuperação PKCE, alteração de e-mail e logout via Supabase Auth. A sessão é persistida/renovada pelo SDK oficial local; senha não é salva pelo Desato. O servidor valida a identidade no Supabase e realiza alterações específicas por tabela com o token do usuário, preservando RLS. Arquivos JSON antigos permanecem locais e não são importados automaticamente.

O modo padrão passou a ser Supabase. JSON fica restrito a desenvolvimento explícito em endereço local. O BAT usa a rota pública de saúde do servidor, em vez de acessar dados antes do login. A troca de conta limpa os dados e modais; respostas de uma sessão anterior não substituem o estado da conta atual.

Verificação remota sem criar contas: cadastro por e-mail habilitado, confirmação obrigatória e tabela de perfis inacessível com apenas a chave pública. O usuário confirmou que adicionou as duas URLs locais de redirecionamento. Não foram enviados e-mails de teste, e a entrega depende da configuração de SMTP do projeto. Nenhum navegador foi aberto; testes de tela usam DOM em memória.

Validação da integração: 40 testes distintos aprovados (suite geral e teste adicional de formulário), cobrindo API, RLS, tela, sessão, troca de contas, salvamentos e ausência de senha no armazenamento local. Layout validado somente pelo código e DOM em memória, conforme orientação do usuário.
