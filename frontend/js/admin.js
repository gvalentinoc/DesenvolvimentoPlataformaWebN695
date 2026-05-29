const API_URL = 'http://localhost:3000/api';
let users = [];
let userModal;
let deleteModal;
let toast;

// Check Auth
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'login.html';
}

// Setup Axios Interceptor for Auth Header
axios.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${token}`;
  return config;
}, error => {
  return Promise.reject(error);
});

axios.interceptors.response.use(response => response, error => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  }
  return Promise.reject(error);
});

// Initialize Bootstrap Components
document.addEventListener('DOMContentLoaded', () => {
  userModal = new bootstrap.Modal(document.getElementById('userModal'));
  deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
  toast = new bootstrap.Toast(document.getElementById('liveToast'));
  
  // Set User Initials in Avatar
  const userData = JSON.parse(localStorage.getItem('user'));
  if (userData && userData.nome && userData.sobrenome) {
    const initials = `${userData.nome.charAt(0)}${userData.sobrenome.charAt(0)}`.toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('dropdownUserName').textContent = `${userData.nome} ${userData.sobrenome}`;
  }
  
  fetchUsers();
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('logoutBtnMobile').addEventListener('click', logout);
  document.getElementById('logoutBtnAvatar').addEventListener('click', logout);
  
  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    renderTable(e.target.value);
  });
  
  // Form Submit
  document.getElementById('userForm').addEventListener('submit', handleUserSubmit);
  
  // Delete Confirm
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
  
  // Reset form on modal open for new user
  document.getElementById('btnNovoUsuario').addEventListener('click', () => {
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userModalTitle').textContent = 'Novo usuário';
    document.getElementById('userSenha').required = true;
    document.getElementById('senhaHelp').classList.add('d-none');
    document.getElementById('modalAlert').classList.add('d-none');
  });
});

const logout = (e) => {
  e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
};

const showToast = (message) => {
  document.getElementById('toastMessage').textContent = message;
  toast.show();
};

const showModalAlert = (message, type = 'danger') => {
  const alertEl = document.getElementById('modalAlert');
  alertEl.textContent = message;
  alertEl.className = `alert alert-${type}`;
  alertEl.classList.remove('d-none');
};

const fetchUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users`);
    users = response.data;
    updateStats();
    renderTable();
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    if (error.response && error.response.status === 403) {
      document.getElementById('usersTableBody').innerHTML = `
        <tr><td colspan="4" class="text-center py-4 text-danger">Acesso negado. Apenas administradores podem ver esta lista.</td></tr>
      `;
    }
  }
};

const updateStats = () => {
  document.getElementById('statTotal').textContent = users.length;
  
  const ativos = users.filter(u => u.status === 'Ativo').length;
  document.getElementById('statAtivos').textContent = ativos;
  
  const today = new Date().setHours(0,0,0,0);
  const novos = users.filter(u => new Date(u.createdAt).setHours(0,0,0,0) === today).length;
  document.getElementById('statNovos').textContent = novos;
};

const renderTable = (searchTerm = '') => {
  const tbody = document.getElementById('usersTableBody');
  
  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    return user.nome.toLowerCase().includes(term) || 
           user.sobrenome.toLowerCase().includes(term) || 
           user.email.toLowerCase().includes(term);
  });
  
  if (filteredUsers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">Nenhum usuário encontrado.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = filteredUsers.map(user => `
    <tr>
      <td class="ps-4 fw-medium text-dark">${user.nome} ${user.sobrenome}</td>
      <td class="text-muted">${user.email}</td>
      <td>
        <span class="badge ${user.status === 'Ativo' ? 'badge-ativo' : 'badge-inativo'} px-2 py-1 rounded-pill">
          ${user.status}
        </span>
      </td>
      <td class="text-end pe-4">
        <button class="action-btn btn-edit me-1" onclick="openEditModal('${user._id}')" title="Editar">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="action-btn btn-delete" onclick="openDeleteModal('${user._id}')" title="Excluir">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
};

window.openEditModal = (id) => {
  const user = users.find(u => u._id === id);
  if (!user) return;
  
  document.getElementById('userId').value = user._id;
  document.getElementById('userNome').value = user.nome;
  document.getElementById('userSobrenome').value = user.sobrenome;
  document.getElementById('userEmail').value = user.email;
  document.getElementById('userStatus').value = user.status;
  
  document.getElementById('userSenha').required = false;
  document.getElementById('userSenha').value = '';
  document.getElementById('senhaHelp').classList.remove('d-none');
  
  document.getElementById('userModalTitle').textContent = 'Editar usuário';
  document.getElementById('modalAlert').classList.add('d-none');
  
  userModal.show();
};

window.openDeleteModal = (id) => {
  document.getElementById('deleteUserId').value = id;
  deleteModal.show();
};

const handleUserSubmit = async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('userId').value;
  const nome = document.getElementById('userNome').value;
  const sobrenome = document.getElementById('userSobrenome').value;
  const email = document.getElementById('userEmail').value;
  const senha = document.getElementById('userSenha').value;
  const status = document.getElementById('userStatus').value;
  
  const btn = document.getElementById('saveUserBtn');
  const originalText = btn.textContent;
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
    
    const payload = { nome, sobrenome, email, status };
    if (senha) payload.senha = senha;
    
    if (id) {
      // Update
      await axios.put(`${API_URL}/users/${id}`, payload);
      showToast('Usuário atualizado com sucesso!');
    } else {
      // Create
      await axios.post(`${API_URL}/users`, payload);
      showToast('Usuário criado com sucesso!');
    }
    
    userModal.hide();
    fetchUsers();
  } catch (error) {
    // Handle duplicate email error specifically
    if (error.response && error.response.status === 400 && error.response.data.message === 'Usuário já existe') {
      showModalAlert('Este e-mail já está cadastrado para outro usuário.');
    } else {
      showModalAlert(error.response?.data?.message || 'Erro ao salvar usuário');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
};

const confirmDelete = async () => {
  const id = document.getElementById('deleteUserId').value;
  const btn = document.getElementById('confirmDeleteBtn');
  const originalText = btn.textContent;
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Excluindo...';
    
    await axios.delete(`${API_URL}/users/${id}`);
    
    deleteModal.hide();
    showToast('Usuário excluído com sucesso!');
    fetchUsers();
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    alert('Erro ao excluir usuário. Tente novamente.');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
};
