const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : 'https://desenvolvimentoplataformawebn695-production.up.railway.app/api';
let users = [];
let books = [];
let userModal;
let deleteModal;
let toast;
let currentSection = 'usuarios';

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
  
  // Navigation Logic (SPA)
  const navUsuarios = document.getElementById('navUsuarios');
  const navAcervo = document.getElementById('navAcervo');
  const navUsuariosMobile = document.getElementById('navUsuariosMobile');
  const navAcervoMobile = document.getElementById('navAcervoMobile');
  
  const sectionUsuarios = document.getElementById('sectionUsuarios');
  const sectionAcervo = document.getElementById('sectionAcervo');
  const sectionAdminLivro = document.getElementById('sectionAdminLivro');
  
  const switchSection = (section) => {
    currentSection = section;
    
    // Hide all sections first
    sectionUsuarios.classList.add('d-none');
    sectionAcervo.classList.add('d-none');
    sectionAdminLivro.classList.add('d-none');
    
    // Reset nav active states
    navUsuarios.classList.remove('active');
    navAcervo.classList.remove('active');
    navUsuariosMobile.classList.remove('active');
    navAcervoMobile.classList.remove('active');
    
    if (section === 'usuarios') {
      sectionUsuarios.classList.remove('d-none');
      navUsuarios.classList.add('active');
      navUsuariosMobile.classList.add('active');
      fetchUsers();
    } else if (section === 'acervo') {
      sectionAcervo.classList.remove('d-none');
      navAcervo.classList.add('active');
      navAcervoMobile.classList.add('active');
      fetchAdminBooks();
    } else if (section === 'adminLivro') {
      sectionAdminLivro.classList.remove('d-none');
      navAcervo.classList.add('active');
      navAcervoMobile.classList.add('active');
    }
  };
  
  navUsuarios.addEventListener('click', (e) => { e.preventDefault(); switchSection('usuarios'); });
  navAcervo.addEventListener('click', (e) => { e.preventDefault(); switchSection('acervo'); });
  navUsuariosMobile.addEventListener('click', (e) => { e.preventDefault(); switchSection('usuarios'); });
  navAcervoMobile.addEventListener('click', (e) => { e.preventDefault(); switchSection('acervo'); });
  
  // Initial load
  fetchUsers();
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('logoutBtnMobile').addEventListener('click', logout);
  document.getElementById('logoutBtnAvatar').addEventListener('click', logout);
  
  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    renderTable(e.target.value);
  });
  
  document.getElementById('searchBookInput').addEventListener('input', (e) => {
    renderBooksTable(e.target.value);
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
  
  // --- Book Form Event Listeners ---
  document.getElementById('btnNovoLivro').addEventListener('click', () => {
    document.getElementById('bookForm').reset();
    document.getElementById('bookId').value = '';
    document.getElementById('bookPageTitle').textContent = 'Cadastrar novo livro';
    document.getElementById('bookPageSubtitle').textContent = 'Preencha os campos e salve';
    document.getElementById('deleteBookBtn').classList.add('d-none');
    document.getElementById('bookAlertMessage').classList.add('d-none');
    switchSection('adminLivro');
  });
  
  document.getElementById('cancelBookBtn').addEventListener('click', () => {
    switchSection('acervo');
  });
  
  document.getElementById('bookForm').addEventListener('submit', handleBookSubmit);
  document.getElementById('deleteBookBtn').addEventListener('click', () => {
    const id = document.getElementById('bookId').value;
    openDeleteModal(id, 'book');
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

window.openDeleteModal = (id, type = 'user') => {
  document.getElementById('deleteUserId').value = id;
  // We use currentSection to determine what to delete, but if called from book form, we force it
  if (type === 'book') {
    currentSection = 'adminLivro';
  }
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
    
    if (currentSection === 'usuarios') {
      await axios.delete(`${API_URL}/users/${id}`);
      showToast('Usuário excluído com sucesso!');
      fetchUsers();
    } else {
      await axios.delete(`${API_URL}/books/${id}`);
      showToast('Livro excluído com sucesso!');
      if (currentSection === 'adminLivro') {
        switchSection('acervo');
      } else {
        fetchAdminBooks();
      }
    }
    
    deleteModal.hide();
  } catch (error) {
    console.error('Erro ao excluir:', error);
    alert('Erro ao excluir. Tente novamente.');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
};

// --- Books Logic for Admin Panel ---

const fetchAdminBooks = async () => {
  try {
    const response = await axios.get(`${API_URL}/books`);
    books = response.data.data || [];
    renderBooksTable();
  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    document.getElementById('booksTableBody').innerHTML = `
      <tr><td colspan="5" class="text-center py-4 text-danger">Erro ao carregar o acervo.</td></tr>
    `;
  }
};

const renderBooksTable = (searchTerm = '') => {
  const tbody = document.getElementById('booksTableBody');
  
  const filteredBooks = books.filter(book => {
    const term = searchTerm.toLowerCase();
    return book.titulo.toLowerCase().includes(term) || 
           book.autor.toLowerCase().includes(term) || 
           book.isbn.toLowerCase().includes(term);
  });
  
  if (filteredBooks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum livro encontrado.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = filteredBooks.map(book => `
    <tr>
      <td class="ps-4 fw-medium text-dark">${book.titulo}</td>
      <td class="text-muted">${book.autor}</td>
      <td class="text-muted">${book.genero}</td>
      <td>
        <span class="badge ${book.disponivel ? 'badge-ativo' : 'badge-inativo'} px-2 py-1 rounded-pill">
          ${book.disponivel ? 'Disponível' : 'Emprestado'}
        </span>
      </td>
      <td class="text-end pe-4">
        <button class="action-btn btn-edit me-1" onclick="openEditBook('${book._id}')" title="Editar">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="action-btn btn-delete" onclick="openDeleteModal('${book._id}', 'book')" title="Excluir">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
};

window.openEditBook = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/books/${id}`);
    const book = response.data;
    
    document.getElementById('bookId').value = book._id;
    document.getElementById('titulo').value = book.titulo;
    document.getElementById('autor').value = book.autor;
    document.getElementById('isbn').value = book.isbn;
    document.getElementById('genero').value = book.genero;
    document.getElementById('anoPublicacao').value = book.anoPublicacao;
    document.getElementById('numeroExemplares').value = book.numeroExemplares;
    document.getElementById('idioma').value = book.idioma;
    document.getElementById('paginas').value = book.paginas;
    document.getElementById('sinopse').value = book.sinopse;
    document.getElementById('urlCapa').value = book.urlCapa || '';
    
    document.getElementById('bookPageTitle').textContent = 'Editar livro';
    document.getElementById('bookPageSubtitle').textContent = 'Altere os campos e salve';
    document.getElementById('deleteBookBtn').classList.remove('d-none');
    document.getElementById('bookAlertMessage').classList.add('d-none');
    
    switchSection('adminLivro');
  } catch (error) {
    console.error('Erro ao buscar dados do livro:', error);
    alert('Erro ao carregar dados do livro. Ele pode ter sido excluído.');
  }
};

const handleBookSubmit = async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('bookId').value;
  const btn = document.getElementById('saveBookBtn');
  const originalText = btn.innerHTML;
  
  const payload = {
    titulo: document.getElementById('titulo').value,
    autor: document.getElementById('autor').value,
    isbn: document.getElementById('isbn').value,
    genero: document.getElementById('genero').value,
    anoPublicacao: parseInt(document.getElementById('anoPublicacao').value),
    numeroExemplares: parseInt(document.getElementById('numeroExemplares').value),
    idioma: document.getElementById('idioma').value,
    paginas: parseInt(document.getElementById('paginas').value),
    sinopse: document.getElementById('sinopse').value,
    urlCapa: document.getElementById('urlCapa').value
  };
  
  const alertEl = document.getElementById('bookAlertMessage');
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
    
    if (id) {
      await axios.put(`${API_URL}/books/${id}`, payload);
      showToast('Livro atualizado com sucesso!');
    } else {
      await axios.post(`${API_URL}/books`, payload);
      showToast('Livro cadastrado com sucesso!');
    }
    
    switchSection('acervo');
  } catch (error) {
    alertEl.textContent = error.response?.data?.message || 'Erro ao salvar livro';
    alertEl.className = 'alert alert-danger mb-4';
    alertEl.classList.remove('d-none');
    window.scrollTo(0, 0);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
};
