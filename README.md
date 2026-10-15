# Desato App

Site e aplicativo para apoio à mudança do consumo de álcool. Node.js, HTML/CSS/JavaScript e Supabase Auth/PostgreSQL, com dados por conta.

## Abrir

No Windows, execute **Abrir aplicativo.bat**. Requer Node.js 18 ou superior. Mantenha a janela do servidor aberta enquanto usar.

- Site: `http://127.0.0.1:4173/`
- Funil de perguntas: `http://127.0.0.1:4173/quiz`
- Aplicativo e login: `http://127.0.0.1:4173/app`

Em desenvolvimento: `npm ci`, `npm start` e `npm test`. O BAT continua funcionando após renomear a pasta porque usa seu próprio diretório.

## Documentação

Documentos de configuração e continuidade em [docs](docs/README.md).

- [Supabase e autenticação](docs/SUPABASE_SETUP.md)
- [Estado atual para continuidade](docs/CODEX_HANDOFF.md)

O funil tem sete perguntas, avanço ao selecionar, checklist e resumo financeiro. As cinco versões são acessadas por links diretos. Coleta de respostas no banco e checkout foram adiados para focar na interface. A economia é uma projeção baseada nas respostas. O site foi criado localmente e ainda precisa de publicação em domínio com HTTPS.
