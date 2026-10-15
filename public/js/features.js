// Lançamento de recursos. false = em teste: só administradores veem. true = liberado para todos os assinantes.
// Para lançar algo novo, troque para true e publique.
export const FEATURES = {
  inicio: true,
  rotina: true,       // Jornada
  sos: true,
  alimentacao: true,  // Corpo e saúde
  apoio: true,        // Situações difíceis
  perfil: true
};

export const canSee = (feature, admin) => FEATURES[feature] === true || admin === true;
