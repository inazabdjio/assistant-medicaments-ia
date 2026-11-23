export const Modal = {
  open(title, bodyHTML) {
    const container = document.getElementById('modal-container');
    if (!container) return;

    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-box">
          <div class="modal-header">
            <h3>${title}</h3>
            <button class="btn btn-outline btn-sm" id="modal-close-btn">✕</button>
          </div>
          <div class="modal-body">${bodyHTML}</div>
        </div>
      </div>
    `;

    document.getElementById('modal-close-btn')?.addEventListener('click', () => this.close());
    document.getElementById('modal-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-backdrop') this.close();
    });
  },

  close() {
    const container = document.getElementById('modal-container');
    if (container) container.innerHTML = '';
  }
};