const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : 'https://desenvolvimentoplataformawebn695-production.up.railway.app/api';
let users = [];
let books = [];
let userModal;
let deleteModal;
let toast;
let currentSection = 'usuarios';
let bookViewMode = 'grid';
let activeBookFilter = 'todos';
let currentPage = 1;
const BOOKS_PER_PAGE = 12;
let bookDetailModal;

const switchSection = (section) => {
  currentSection = section;

  document.getElementById('sectionUsuarios').classList.add('d-none');
  document.getElementById('sectionAcervo').classList.add('d-none');
  document.getElementById('sectionAdminLivro').classList.add('d-none');

  ['navUsuarios', 'navAcervo', 'navUsuariosMobile', 'navAcervoMobile'].forEach(id => {
    document.getElementById(id).classList.remove('active');
  });

  if (section === 'usuarios') {
    document.getElementById('sectionUsuarios').classList.remove('d-none');
    document.getElementById('navUsuarios').classList.add('active');
    document.getElementById('navUsuariosMobile').classList.add('active');
    fetchUsers();
  } else if (section === 'acervo') {
    document.getElementById('sectionAcervo').classList.remove('d-none');
    document.getElementById('navAcervo').classList.add('active');
    document.getElementById('navAcervoMobile').classList.add('active');
    fetchAdminBooks();
  } else if (section === 'adminLivro') {
    document.getElementById('sectionAdminLivro').classList.remove('d-none');
    document.getElementById('navAcervo').classList.add('active');
    document.getElementById('navAcervoMobile').classList.add('active');
  }
};

axios.defaults.withCredentials = true;

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(response => response, error => {
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }
  return Promise.reject(error);
});

document.addEventListener('DOMContentLoaded', () => {
  const userData = JSON.parse(localStorage.getItem('user'));
  if (!userData || userData.role !== 'admin') {
    window.location.href = userData ? 'leitor.html' : 'login.html';
    return;
  }

  userModal = new bootstrap.Modal(document.getElementById('userModal'));
  deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
  bookDetailModal = new bootstrap.Modal(document.getElementById('bookDetailModal'));
  toast = new bootstrap.Toast(document.getElementById('liveToast'));

  if (userData.nome && userData.sobrenome) {
    const initials = `${userData.nome.charAt(0)}${userData.sobrenome.charAt(0)}`.toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('dropdownUserName').textContent = `${userData.nome} ${userData.sobrenome}`;
  }

  const navUsuarios = document.getElementById('navUsuarios');
  const navAcervo = document.getElementById('navAcervo');
  const navUsuariosMobile = document.getElementById('navUsuariosMobile');
  const navAcervoMobile = document.getElementById('navAcervoMobile');


  navUsuarios.addEventListener('click', (e) => { e.preventDefault(); switchSection('usuarios'); });
  navAcervo.addEventListener('click', (e) => { e.preventDefault(); switchSection('acervo'); });
  navUsuariosMobile.addEventListener('click', (e) => { e.preventDefault(); switchSection('usuarios'); });
  navAcervoMobile.addEventListener('click', (e) => { e.preventDefault(); switchSection('acervo'); });

  fetchUsers();

  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('logoutBtnMobile').addEventListener('click', logout);
  document.getElementById('logoutBtnAvatar').addEventListener('click', logout);

  document.getElementById('searchInput').addEventListener('input', (e) => {
    renderTable(e.target.value);
  });

  document.getElementById('searchBookInput').addEventListener('input', () => {
    currentPage = 1;
    renderBooks();
  });

  document.getElementById('btnViewGrid').addEventListener('click', () => {
    bookViewMode = 'grid';
    document.getElementById('btnViewGrid').classList.add('active');
    document.getElementById('btnViewList').classList.remove('active');
    document.getElementById('booksGrid').classList.remove('d-none');
    document.getElementById('booksList').classList.add('d-none');
    renderBooks();
  });

  document.getElementById('btnViewList').addEventListener('click', () => {
    bookViewMode = 'list';
    document.getElementById('btnViewList').classList.add('active');
    document.getElementById('btnViewGrid').classList.remove('active');
    document.getElementById('booksGrid').classList.add('d-none');
    document.getElementById('booksList').classList.remove('d-none');
    renderBooks();
  });

  document.getElementById('bookFilters').addEventListener('click', (e) => {
    const btn = e.target.closest('.book-filter-btn');
    if (!btn) return;
    document.querySelectorAll('.book-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeBookFilter = btn.dataset.filter;
    currentPage = 1;
    renderBooks();
  });

  document.getElementById('userForm').addEventListener('submit', handleUserSubmit);

  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

  document.getElementById('btnNovoUsuario').addEventListener('click', () => {
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userModalTitle').textContent = 'Novo usuário';
    document.getElementById('userSenha').required = true;
    document.getElementById('senhaHelp').classList.add('d-none');
    document.getElementById('modalAlert').classList.add('d-none');
    document.getElementById('userRole').value = 'leitor';
  });

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

const logout = async (e) => {
  e?.preventDefault();
  try { await axios.post(`${API_URL}/auth/logout`); } catch (_) {}
  localStorage.removeItem('user');
  localStorage.removeItem('token');
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
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum usuário encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredUsers.map(user => `
    <tr>
      <td class="ps-4 fw-medium text-dark">${user.nome} ${user.sobrenome}</td>
      <td class="text-muted">${user.email}</td>
      <td>
        <span class="badge px-2 py-1 rounded-pill fw-normal ${user.role === 'admin' ? 'bg-primary-custom text-white' : 'bg-light text-muted border'}">
          ${user.role === 'admin' ? 'Admin' : 'Leitor'}
        </span>
      </td>
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
  document.getElementById('userRole').value = user.role || 'leitor';

  document.getElementById('userSenha').required = false;
  document.getElementById('userSenha').value = '';
  document.getElementById('senhaHelp').classList.remove('d-none');

  document.getElementById('userModalTitle').textContent = 'Editar usuário';
  document.getElementById('modalAlert').classList.add('d-none');

  userModal.show();
};

window.openDeleteModal = (id, type = 'user') => {
  document.getElementById('deleteUserId').value = id;
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

    const role = document.getElementById('userRole').value;
    const payload = { nome, sobrenome, email, status, role };
    if (senha) payload.senha = senha;

    if (id) {
      await axios.put(`${API_URL}/users/${id}`, payload);
      showToast('Usuário atualizado com sucesso!');
    } else {
      await axios.post(`${API_URL}/users`, payload);
      showToast('Usuário criado com sucesso!');
    }

    userModal.hide();
    fetchUsers();
  } catch (error) {
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

const fetchAdminBooks = async () => {
  try {
    const response = await axios.get(`${API_URL}/books?limite=1000`);
    books = response.data.data || [];
    currentPage = 1;
    renderBooks();
  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    document.getElementById('booksGrid').innerHTML = `<div class="col-12 text-center py-5 text-danger">Erro ao carregar o acervo.</div>`;
  }
};

const getFilteredBooks = () => {
  const searchTerm = document.getElementById('searchBookInput').value.toLowerCase();
  return books.filter(book => {
    const matchesSearch = !searchTerm ||
      book.titulo.toLowerCase().includes(searchTerm) ||
      book.autor.toLowerCase().includes(searchTerm) ||
      book.isbn.toLowerCase().includes(searchTerm);
    const matchesFilter = activeBookFilter === 'todos' ||
      (activeBookFilter === 'Disponível' && book.disponivel) ||
      book.genero === activeBookFilter;
    return matchesSearch && matchesFilter;
  });
};

const renderBooks = () => {
  const filtered = getFilteredBooks();
  const total = filtered.length;
  const totalPages = Math.ceil(total / BOOKS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * BOOKS_PER_PAGE, currentPage * BOOKS_PER_PAGE);

  document.getElementById('booksCount').textContent = `${total} livro${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;

  if (bookViewMode === 'grid') {
    renderBooksGrid(paginated, total);
  } else {
    renderBooksTable(paginated, total);
  }
  renderPagination(totalPages);
};

const renderBooksGrid = (paginated, total) => {
  const grid = document.getElementById('booksGrid');
  if (total === 0) {
    grid.innerHTML = `<div class="col-12 text-center py-5 text-muted">Nenhum livro encontrado.</div>`;
    return;
  }
  grid.innerHTML = paginated.map(book => `
    <div class="col-6 col-sm-4 col-md-3 col-xl-2">
      <div class="book-card h-100" onclick="openBookDetail('${book._id}')" style="cursor:pointer;">
        <div class="book-card-cover">
          ${book.urlCapa
            ? `<img src="${book.urlCapa}" alt="${book.titulo}" onerror="this.parentElement.innerHTML='<i class=\\'bi bi-book cover-placeholder\\'></i>'">`
            : `<i class="bi bi-book cover-placeholder"></i>`}
        </div>
        <div class="book-card-body">
          <div class="book-card-genre mb-1">${book.genero}</div>
          <div class="book-card-title" title="${book.titulo}">${book.titulo}</div>
          <div class="book-card-author">${book.autor}</div>
          <div class="book-card-footer">
            <span class="badge ${book.disponivel ? 'badge-ativo' : 'badge-inativo'} px-2 py-1 rounded-pill" style="font-size:11px;">
              ${book.disponivel ? 'Disponível' : 'Emprestado'}
            </span>
            <div class="d-flex gap-1">
              <button class="action-btn btn-edit" onclick="event.stopPropagation();openEditBook('${book._id}')" title="Editar">
                <i class="bi bi-pencil" style="font-size:12px;"></i>
              </button>
              <button class="action-btn btn-delete" onclick="event.stopPropagation();openDeleteModal('${book._id}', 'book')" title="Excluir">
                <i class="bi bi-trash" style="font-size:12px;"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
};

const renderBooksTable = (paginated, total) => {
  const tbody = document.getElementById('booksTableBody');
  if (total === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum livro encontrado.</td></tr>`;
    return;
  }
  tbody.innerHTML = paginated.map(book => `
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

const renderPagination = (totalPages) => {
  const nav = document.getElementById('booksPagination');
  const list = document.getElementById('paginationList');
  if (totalPages <= 1) { nav.classList.add('d-none'); return; }
  nav.classList.remove('d-none');
  let html = `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="goToPage(${currentPage - 1})">← Ant.</a>
    </li>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
      <a class="page-link" href="#" onclick="goToPage(${i})">${i}</a>
    </li>`;
  }
  html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="goToPage(${currentPage + 1})">Próx. →</a>
  </li>`;
  list.innerHTML = html;
};

window.openBookDetail = (id) => {
  const book = books.find(b => b._id === id);
  if (!book) return;

  const cover = document.getElementById('detailCover');
  if (book.urlCapa) {
    cover.innerHTML = `<img src="${book.urlCapa}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<i class=\\'bi bi-book text-white\\' style=\\'font-size:1.8rem;opacity:0.5;\\'></i>'">`;
  } else {
    cover.innerHTML = `<i class="bi bi-book text-white" style="font-size:1.8rem;opacity:0.5;"></i>`;
  }

  document.getElementById('detailTitulo').textContent = book.titulo;
  document.getElementById('detailAutor').textContent = book.autor;
  document.getElementById('detailIsbn').textContent = book.isbn;
  document.getElementById('detailAno').textContent = book.anoPublicacao;
  document.getElementById('detailPaginas').textContent = book.paginas;
  document.getElementById('detailSinopse').textContent = book.sinopse || 'Sem sinopse cadastrada.';
  document.getElementById('detailGeneroBadge').textContent = book.genero;

  const statusBadge = document.getElementById('detailStatusBadge');
  if (book.disponivel) {
    statusBadge.textContent = `Disponível (${book.numeroExemplares} ex.)`;
    statusBadge.className = 'badge badge-ativo px-2 py-1 rounded-pill';
  } else {
    statusBadge.textContent = 'Emprestado';
    statusBadge.className = 'badge badge-inativo px-2 py-1 rounded-pill';
  }

  document.getElementById('detailEditBtn').onclick = () => { bookDetailModal.hide(); openEditBook(id); };
  document.getElementById('detailDeleteBtn').onclick = () => { bookDetailModal.hide(); openDeleteModal(id, 'book'); };

  bookDetailModal.show();
};

window.goToPage = (page) => {
  const filtered = getFilteredBooks();
  const totalPages = Math.ceil(filtered.length / BOOKS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderBooks();
  document.getElementById('sectionAcervo').scrollIntoView({ behavior: 'smooth' });
};

window.openEditBook = (id) => {
  const book = books.find(b => b._id === id);
  if (!book) { alert('Livro não encontrado. Recarregue o acervo.'); return; }

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

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';

  let saved = false;
  try {
    if (id) {
      await axios.put(`${API_URL}/books/${id}`, payload);
    } else {
      await axios.post(`${API_URL}/books`, payload);
    }
    saved = true;
  } catch (error) {
    alertEl.textContent = error.response?.data?.message || 'Erro ao salvar livro';
    alertEl.className = 'alert alert-danger mb-4';
    alertEl.classList.remove('d-none');
    window.scrollTo(0, 0);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }

  if (saved) {
    showToast(id ? 'Livro atualizado com sucesso!' : 'Livro cadastrado com sucesso!');
    switchSection('acervo');
  }
};