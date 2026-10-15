// Situações difíceis: a pessoa prepara três respostas antes de o momento chegar.
export const SITUATIONS = [
  {
    id: 'festa', title: 'Festa ou aniversário', hint: 'Bebida por todo lado e gente oferecendo.',
    suggestions: {
      drink: ['Refrigerante zero com gelo e limão', 'Água com gás', 'Cerveja sem álcool'],
      refuse: ['Hoje não, valeu. Tô de boa com o refri.', 'Tô dando um tempo na bebida.', 'Tô dirigindo hoje.'],
      leaveAt: ['Antes da meia-noite', 'Quando começarem as rodadas de shot', 'Depois de cantar parabéns']
    }
  },
  {
    id: 'sexta', title: 'Sexta à noite', hint: 'O fim de semana chega e o corpo pede a cerveja de sempre.',
    suggestions: {
      drink: ['Um suco gelado que eu goste', 'Chá gelado', 'Água com gás e limão'],
      refuse: ['Essa sexta eu vou ficar em casa.', 'Hoje não, mas topo um almoço amanhã.', 'Tô cuidando do sono essa semana.'],
      leaveAt: ['Às 22h, depois do jantar', 'Logo depois de comer', 'Na hora que a bebida começar']
    }
  },
  {
    id: 'briga', title: 'Depois de uma briga', hint: 'Raiva, mágoa e vontade de esquecer.',
    suggestions: {
      drink: ['Um copo de água gelada', 'Um chá quente', 'Um café descafeinado'],
      refuse: ['Agora eu preciso de um tempo sozinho.', 'Vou dar uma volta e já volto.', 'Não vou resolver isso bebendo.'],
      leaveAt: ['Saio para caminhar por 15 minutos', 'Vou para outro cômodo e respiro', 'Ligo para alguém de confiança']
    }
  },
  {
    id: 'solidao', title: 'Sozinho em casa', hint: 'Silêncio, tédio e a noite parecendo longa.',
    suggestions: {
      drink: ['Chá quente', 'Chocolate quente', 'Água com gás'],
      refuse: ['Hoje a noite é minha, sem bebida.', 'Vou ligar para alguém em vez de beber.', 'Uma série e cama cedo.'],
      leaveAt: ['Deitar às 23h', 'Sair para caminhar depois do jantar', 'Ligar para alguém às 21h']
    }
  },
  {
    id: 'estresse', title: 'Estresse no trabalho', hint: 'Dia pesado e a sensação de que você merece uma bebida.',
    suggestions: {
      drink: ['Um lanche e um suco ao chegar', 'Água gelada', 'Chá de camomila'],
      refuse: ['Hoje vou direto para casa.', 'Prefiro um café em vez do bar.', 'Tô cansado, fica pra próxima.'],
      leaveAt: ['Sair do trabalho direto para casa', 'Banho assim que chegar', 'Caminhada antes do jantar']
    }
  },
  {
    id: 'familia', title: 'Almoço de família', hint: 'Churrasco, cerveja gelada e alguém insistindo.',
    suggestions: {
      drink: ['Refrigerante', 'Suco natural', 'Cerveja sem álcool'],
      refuse: ['Hoje não, obrigado. Tô bem assim.', 'Tô dando um tempo, depois eu conto.', 'Vou ficar no refri hoje.'],
      leaveAt: ['Depois da sobremesa', 'Às 17h', 'Quando começarem a beber mais']
    }
  }
];

export const SITUATION_IDS = SITUATIONS.map(situation => situation.id);
