import { QUIZZES } from './quiz-model.js';
// Mantém os callbacks já autorizados no Supabase e os antigos links do app.
const query = new URLSearchParams(location.search);
if (query.has('code') || query.has('reset') || query.has('error') || /access_token=|error_description=/.test(location.hash) || /^#(inicio|rotina|sos|alimentacao|apoio|perfil)$/.test(location.hash)) {
  location.replace('/app' + location.search + location.hash);
} else {
  document.querySelector('#quiz-list').innerHTML = QUIZZES.map(quiz => `<a class="quiz-card" href="/quiz/${quiz.id}"><span class="card-number">${quiz.number}<span aria-hidden="true">↗</span></span><h3>${quiz.title}</h3><p>${quiz.subtitle}</p><span class="card-meta">7 perguntas · ver meu momento</span></a>`).join('');
}
