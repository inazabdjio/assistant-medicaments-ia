export function escapeHTML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatRoleLabel(role) {
  const map = {
    admin: 'Administrateur',
    professionnel: 'Professionnel de santé',
    usager: 'Usager'
  };
  return map[role] || role;
}

export function formatStatutMed(statut) {
  if (statut === 'valide') return '<span class="badge badge-success">Validé & Vrai</span>';
  if (statut === 'deprecie') return '<span class="badge badge-danger">Déprécié / Retiré</span>';
  return '<span class="badge badge-warning">En cours de validation</span>';
}