const userForm = document.querySelector('#user-form');
const userMessage = document.querySelector('#user-message');
const usersTable = document.querySelector('#users-table');
const userFormTitle = document.querySelector('#user-form-title');
const clearUserForm = document.querySelector('#clear-user-form');

let users = [];

function resetUserForm() {
  userForm.reset();
  userForm.elements.id.value = '';
  userForm.elements.senha.required = true;
  userFormTitle.textContent = 'Cadastrar usuário';
  showMessage(userMessage, '');
}

function renderUsers() {
  if (!users.length) {
    usersTable.innerHTML = emptyRow(5, 'Nenhum usuário cadastrado.');
    return;
  }

  usersTable.innerHTML = users.map((user) => `
    <tr>
      <td>${escapeHtml(user.nome)}</td>
      <td>${escapeHtml(user.usuario)}</td>
      <td>${escapeHtml(user.tipo_usuario)}</td>
      <td>${formatDateTime(user.criado_em)}</td>
      <td>
        <div class="actions">
          <button class="table-button" type="button" data-edit="${user.id}">Editar</button>
          <button class="danger-button" type="button" data-delete="${user.id}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function loadUsers() {
  const data = await apiRequest('/api/usuarios');
  users = data.data;
  renderUsers();
}

userForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = readForm(userForm);
  const id = payload.id;
  delete payload.id;

  try {
    const data = await apiRequest(id ? `/api/usuarios/${id}` : '/api/usuarios', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });

    resetUserForm();
    showMessage(userMessage, data.message, true);
    await loadUsers();
  } catch (error) {
    showMessage(userMessage, error.message);
  }
});

usersTable.addEventListener('click', async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    const user = users.find((item) => item.id === Number(editId));
    userForm.elements.id.value = user.id;
    userForm.elements.nome.value = user.nome;
    userForm.elements.usuario.value = user.usuario;
    userForm.elements.tipo_usuario.value = user.tipo_usuario;
    userForm.elements.senha.value = '';
    userForm.elements.senha.required = false;
    userFormTitle.textContent = 'Editar usuário';
    window.location.hash = 'cadastro';
  }

  if (deleteId && confirm('Deseja realmente excluir este usuário?')) {
    try {
      await apiRequest(`/api/usuarios/${deleteId}`, { method: 'DELETE' });
      await loadUsers();
    } catch (error) {
      alert(error.message);
    }
  }
});

clearUserForm.addEventListener('click', resetUserForm);
resetUserForm();
loadUsers();
