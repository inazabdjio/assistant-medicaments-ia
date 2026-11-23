import { AuthService } from '../services/authService.js';
import { Validation } from '../utils/validation.js';
import { Notification } from '../components/notification.js';

export function renderInscriptionPage(container, onNavigate) {
  container.innerHTML = `
    <div style="max-width:520px;margin:1rem auto;">
      <div class="card">
        <h2 class="mb-1">Créer un compte</h2>
        <p class="text-sm text-muted mb-2">Inscrivez-vous en tant qu'usager ou professionnel de santé.</p>

        <form id="register-form">
          <div class="form-group">
            <label class="form-label">Type de compte</label>
            <select id="reg-role" class="form-control">
              <option value="usager">Usager (Citoyen)</option>
              <option value="professionnel">Professionnel de santé (Pharmacien / Médecin)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Nom complet</label>
            <input type="text" id="reg-nom" class="form-control" placeholder="Ex: Dr. Tchinda Paul" required />
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="reg-email" class="form-control" placeholder="email@domaine.cm" required />
          </div>

          <div id="pro-fields" style="display:none;">
            <div class="form-group">
              <label class="form-label">Spécialité médicale / pharmaceutique</label>
              <input type="text" id="reg-specialite" class="form-control" placeholder="Ex: Pharmacien d'officine" />
            </div>
            <div class="form-group">
              <label class="form-label">Numéro d'inscription à l'Ordre</label>
              <input type="text" id="reg-ordre" class="form-control" placeholder="Ex: ONPC-4512" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Mot de passe (min. 6 caractères)</label>
            <input type="password" id="reg-password" class="form-control" required />
          </div>

          <button type="submit" class="btn btn-primary" style="width:100%;">S'inscrire</button>
        </form>
      </div>
    </div>
  `;

  const roleSelect = document.getElementById('reg-role');
  const proFields = document.getElementById('pro-fields');

  roleSelect.addEventListener('change', () => {
    proFields.style.display = roleSelect.value === 'professionnel' ? 'block' : 'none';
  });

  document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const role = roleSelect.value;
    const nom = document.getElementById('reg-nom').value;
    const email = document.getElementById('reg-email').value;
    const motDePasse = document.getElementById('reg-password').value;
    const specialite = document.getElementById('reg-specialite').value;
    const numeroOrdre = document.getElementById('reg-ordre').value;

    if (!Validation.isEmail(email)) return Notification.show('Email invalide.', 'error');
    if (!Validation.minLength(motDePasse, 6)) return Notification.show('Mot de passe trop court (min 6).', 'error');
    if (role === 'professionnel' && (!Validation.isNotEmpty(specialite) || !Validation.isNotEmpty(numeroOrdre))) {
      return Notification.show('Veuillez renseigner votre spécialité et numéro d’Ordre.', 'warning');
    }

    const res = AuthService.register({ nom, email, motDePasse, role, specialite, numeroOrdre });
    if (!res.success) return Notification.show(res.message, 'error');

    if (res.pendingValidation) {
      Notification.show(res.message, 'warning', 6000);
      onNavigate('connexion');
    } else {
      Notification.show('Compte créé avec succès !', 'success');
      onNavigate('accueil');
    }
  });
}