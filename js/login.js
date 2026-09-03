const loginForm = document.querySelector('#login-form');
const loginMessage = document.querySelector('#login-message');
const submitButton = loginForm.querySelector('button[type="submit"]');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const username = formData.get('username').trim();
  const password = formData.get('password').trim();

  loginMessage.textContent = '';

  if (!username || !password) {
    loginMessage.textContent = 'Informe usuário e senha para continuar.';
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Entrando...';

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      loginMessage.textContent = data.message || 'Não foi possível fazer login.';
      return;
    }

    window.location.href = 'dashboard.html';
  } catch (error) {
    loginMessage.textContent = 'Erro de conexão com o servidor.';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Entrar';
  }
});
