// Lançamento de recursos. false = em teste: só administradores veem. true = liberado para todos os assinantes.
// Para lançar algo novo, troque para true e publique.
export const FEATURES = {
  inicio: true,
  sos: true,
  apoio: false,       // Situações difíceis: removida do menu
  perfil: true,
  plano: true
};

export const canSee = (feature, admin) => FEATURES[feature] === true || admin === true;
