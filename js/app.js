async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (response.status === 401) {
    window.location.href = 'index.html';
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erro na requisição.');
  }

  return data;
}

async function loadLoggedUser() {
  const data = await apiRequest('/api/me');
  const chip = document.querySelector('#user-chip');

  if (data && chip) {
    const rawRole =
      data.user.tipo_usuario ||
      data.user.perfil ||
      data.user.funcao ||
      data.user.tipo ||
      data.user.role ||
      '';

    const formattedRole = rawRole
      ? rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase()
      : 'Sem função';

    chip.textContent = `${data.user.nome} (${formattedRole})`;
  }
}

function setupLogout() {
  document.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', async () => {
      await fetch('/logout', {
        method: 'POST',
        credentials: 'include'
      });

      window.location.href = 'index.html';
    });
  });
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

function toInputDate(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function readForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showMessage(element, message, success = false) {
  element.textContent = message;
  element.classList.toggle('success', success);
}

function emptyRow(colspan, text) {
  return `<tr><td colspan="${colspan}">${text}</td></tr>`;
}

loadLoggedUser();
setupLogout();
