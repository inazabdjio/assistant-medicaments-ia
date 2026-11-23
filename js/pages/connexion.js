import { AuthService } from '../services/authService.js';
import { Notification } from '../components/notification.js';

export function renderConnexionPage(container, onNavigate) {
  container.innerHTML = `
    <div style="max-width:460px;margin:1.5rem auto;">
      <div class="card">
        <h2 class="mb-1">Connexion</h2>
        <p class="text-sm text-muted mb-2">Accédez à votre espace Usager, Professionnel de santé ou Administrateur.</p>

        <form id="login-form">
          <div class="form-group">
            <label class="form-label">Adresse Email</label>
            <input type="email" id="login-email" class="form-control" placeholder="exemple@mediassist.cm" required />
          </div>
          <div class="form-group">
            <label class="form-label">Mot de passe</label>
            <input type="password" id="login-password" class="form-control" placeholder="••••••••" required />
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">Se connecter</button>
        </form>

        <div class="mt-3 pt-2" style="border-top:1px solid var(--border);">
          <p class="text-sm font-bold mb-1">Comptes de test rapide (1 clic) :</p>
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
            <button class="btn btn-outline btn-sm" data-demo="usager@mediassist.cm|Usager123!">Usager</button>
            <button class="btn btn-outline btn-sm" data-demo="dr.kamga@mediassist.cm|Sante123!">Pro Santé (Validé)</button>
            <button class="btn btn-outline btn-sm" data-demo="dr.ndongo@mediassist.cm|Sante123!">Pro Santé (En attente)</button>
            <button class="btn btn-outline btn-sm" data-demo="admin@mediassist.cm|Admin123!">Administrateur</button>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-demo]').forEach(btn => {
    btn.addEventListener('click', () => {
      const [email, pass] = btn.dataset.demo.split('|');
      document.getElementById('login-email').value = email;
      document.getElementById('login-password').value = pass;
    });
  });

  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    const result = AuthService.login(email, pass);

    if (!result.success) {
      Notification.show(result.message, 'error', 5000);
      return;
    }

    Notification.show(`Bienvenue, ${result.user.nom} !`, 'success');
    if (result.user.role === 'admin') onNavigate('administrateur');
    else if (result.user.role === 'professionnel') onNavigate('professionnel');
    else onNavigate('accueil');
  });
}