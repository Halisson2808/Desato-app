# Novo Início do Desato — 06/10/2026

## Objetivo e implementação

A pessoa abre o aplicativo, registra se bebeu hoje, vê o mês por cores e acompanha sua evolução. O dinheiro entra abaixo como motivação complementar, sem tirar o foco do registro diário. A tela foi implementada aproveitando as contas, dados e APIs atuais; nenhuma migração de banco foi necessária.

## Ordem da tela

1. Saudação curta.
2. Pergunta em destaque: **Você bebeu hoje?**
3. Dois botões grandes: **Não bebi hoje** e **Bebi hoje**.
4. Calendário mensal imediatamente abaixo.
5. Convite para calcular gastos ou número grande de gasto evitado, quando há valores válidos.
6. Resumo do mês e atalho para a rotina.

No celular, os blocos são verticais. No computador, gasto evitado e resumo do mês ficam lado a lado, abaixo do calendário. Header e as outras abas permanecem como estão. As propostas de logo continuam salvas, sem aplicação automática.

Ajuste de compactação solicitado: menos preenchimento e espaço vertical no card de hoje, título menor e botões com altura mínima de 44 px. Calendário com dias de 44 px, menos distância entre linhas e cabeçalho/legenda mais próximos. No computador, os dias foram reduzidos de 75 para 44 px. Funções e cores permanecem iguais.

## Registro de hoje

O toque em Não bebi/Bebi salva diretamente. A resposta fica visualmente selecionada. O botão Adicionar anotação abre um formulário opcional; editar o registro mantém a anotação existente.

Cada data tem um registro. Toques repetidos não criam novos dias nem duplicam economia. Trocar a resposta recalcula os indicadores, preservando o restante do histórico. Um dia com consumo não apaga os dias anteriores.

## Calendário

- **Verde:** dia registrado sem consumo, acompanhado de ✓.
- **Vermelho:** dia registrado com consumo, acompanhado de ×.
- **Cinza:** dia sem registro.
- **Hoje:** contorno adicional.
- **Anotação existente:** pequeno ponto no dia.
- **Dias futuros:** cinza discreto, sem permitir registro.

As cores têm legenda; os botões também informam data e estado para leitores de tela. Sem registro nunca significa sem consumo. Dias futuros não entram no resumo do mês.

As setas navegam por meses anteriores, usando os dados já carregados, sem exigir uma nova consulta ao servidor. Próximo mês fica indisponível quando chega ao mês atual. A virada do mês acompanha automaticamente o mês atual; quem está consultando um mês antigo continua nele.

Tocar em uma data abre a resposta e a anotação para leitura ou correção. Escolher uma data oferece acesso direto a registros mais antigos. Dias sem registro exigem escolher uma resposta antes de salvar; o formulário não inventa um dia sem consumo.

## Calculadora e evolução financeira

Antes de configurar, mostrar: **“Quer calcular quanto costuma gastar com bebida e acompanhar sua evolução?”**, com o botão **Calcular meu gasto**.

Perguntas:

1. Gasto médio com bebidas por saída, em reais.
2. Quantas saídas por semana, em média.

O formulário já mostra mês e média diária antes de salvar. Permite frequência fracionada e zero; valores sem gasto positivo não criam ganho fictício. O convite permanece quando o gasto ou a frequência é zero.

Usar a base existente:

- Semana = gasto por saída × saídas semanais.
- Ano = semana × 52.
- Mês médio = ano ÷ 12.
- Média diária = ano ÷ 365.
- Gasto evitado do mês = média diária × dias desse mês registrados sem consumo.
- Gasto evitado de hoje = média diária, somente se hoje estiver registrado sem consumo.
- Total desde o primeiro registro = média diária × todos os dias registrados sem consumo, até hoje.

Exemplo conceitual: se o cálculo resultar em média diária de R$ 20, cinco dias sem consumo representam R$ 100 estimados no mês. Registrar mais um dia sem consumo leva a R$ 120. Corrigir esse dia para consumo retorna a R$ 100; tocar novamente no mesmo registro não muda o total.

O número principal acompanha o mês exibido no calendário, com mês/ano escritos no cartão. O valor de hoje só aparece junto ao mês atual, evitando misturar períodos. O total geral é secundário.

É **gasto evitado estimado**, não lucro, crédito, saldo ou transferência. A média distribui o hábito informado pelos dias; não prova uma compra evitada em cada data. Não descontar assinatura neste cartão: ele acompanha gastos com bebidas, separado da comparação comercial do funil.

Editar gasto/frequência recalcula as estimativas com os novos valores; esta versão não conserva históricos de diferentes médias de gasto. Registros anteriores já entram no cálculo ao configurar, sem criar novos check-ins.

## Resumo da evolução

Três números para o mês: dias sem beber, dias com consumo e dias passados sem registro. A proporção de dias sem consumo considera somente os dias registrados; dias em branco ficam fora desse percentual.

A sequência de abstinência deixa de dominar a abertura. O destaque vai para a pergunta, o calendário e os registros acumulados. Rotina aparece como complemento, com hábitos concluídos e atalho para abrir a aba.

## Arquivos e verificação

Tela: `public/js/views/home.js`. Calendário e cálculo: `public/js/content/home-progress.js`. Estilos: `public/styles.css`. Cache atualizado em `public/sw.js`; redesenho local disponível no contexto do app em `public/js/app.js`.

Os testes verificam cores por estado, notas escapadas, datas futuras, ano bissexto, troca de mês, virada mensal, cálculos por mês e total, correção e idempotência dos registros, estado sem cálculo e compatibilidade com login/dados existentes. A inspeção no navegador não foi realizada, seguindo a preferência do usuário.

Coleta do funil e checkout continuam adiados. Nenhum pagamento, contato externo, conta nova ou importação de dados foi feito nesta alteração.
