const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : 'https://desenvolvimentoplataformawebn695-production.up.railway.app/api';

axios.defaults.withCredentials = true;

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(response => response, error => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }
  return Promise.reject(error);
});

let currentPage = 1;
let currentFilters = {};
let currentSearch = '';
let books = [];
let bookDetailModal;
let viewMode = 'grid';

// Advanced filter state
const advFilters = { genero: null, disponibilidade: null, periodo: null, idioma: null, ordem: null };

document.addEventListener('DOMContentLoaded', () => {
  const userData = JSON.parse(localStorage.getItem('user'));
  if (!userData) {
    window.location.href = 'login.html';
    return;
  }
  if (userData.role === 'admin') {
    window.location.href = 'admin.html';
    return;
  }

  bookDetailModal = new bootstrap.Modal(document.getElementById('bookDetailModal'));

  const pendingSection = sessionStorage.getItem('leitorSection');
  if (pendingSection) {
    sessionStorage.removeItem('leitorSection');
    switchSection(pendingSection);
  }

  // Avatar
  if (userData.nome && userData.sobrenome) {
    const initials = `${userData.nome.charAt(0)}${userData.sobrenome.charAt(0)}`.toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('dropdownUserName').textContent = `${userData.nome} ${userData.sobrenome}`;
  }

  // Navigation
  document.getElementById('navAcervo').addEventListener('click', (e) => { e.preventDefault(); switchSection('acervo'); });
  document.getElementById('navMinhaConta').addEventListener('click', (e) => { e.preventDefault(); switchSection('conta'); });
  document.getElementById('btnSair').addEventListener('click', logout);

  // View toggle
  document.getElementById('btnGrid').addEventListener('change', () => {
    viewMode = 'grid';
    renderBooks(books);
  });
  document.getElementById('btnList').addEventListener('change', () => {
    viewMode = 'list';
    renderBooks(books);
  });

  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    currentPage = 1;
    fetchBooks();
  });

  // Quick filter chips
  document.querySelectorAll('#quickFilters .filter-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('#quickFilters .filter-chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      const filter = e.target.dataset.filter;
      currentFilters = {};
      Object.keys(advFilters).forEach(k => advFilters[k] = null);
      clearAdvFilterUI();
      if (filter !== 'all') {
        const [key, value] = filter.split('=');
        currentFilters[key] = value;
      }
      currentPage = 1;
      fetchBooks();
    });
  });

  // Advanced filter chips (single-select per group)
  ['filterGenero', 'filterDisponibilidade', 'filterPeriodo', 'filterIdioma', 'filterOrdem'].forEach(groupId => {
    document.getElementById(groupId).addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      const wasActive = chip.classList.contains('active');
      document.querySelectorAll(`#${groupId} .filter-chip`).forEach(c => c.classList.remove('active'));
      if (!wasActive) chip.classList.add('active');
    });
  });

  // Apply filters button
  document.getElementById('applyFiltersBtn').addEventListener('click', () => {
    currentFilters = {};
    document.querySelectorAll('#quickFilters .filter-chip').forEach(c => c.classList.remove('active'));
    document.querySelector('#quickFilters .filter-chip[data-filter="all"]').classList.add('active');

    const genero = document.querySelector('#filterGenero .filter-chip.active');
    const disponivel = document.querySelector('#filterDisponibilidade .filter-chip.active');
    const periodo = document.querySelector('#filterPeriodo .filter-chip.active');
    const idioma = document.querySelector('#filterIdioma .filter-chip.active');
    const ordem = document.querySelector('#filterOrdem .filter-chip.active');

    if (genero) currentFilters.genero = genero.dataset.value;
    if (disponivel) currentFilters.disponivel = disponivel.dataset.value;
    if (periodo) currentFilters.periodo = periodo.dataset.value;
    if (idioma) currentFilters.idioma = idioma.dataset.value;
    if (ordem) currentFilters.ordem = ordem.dataset.value;

    currentPage = 1;
    fetchBooks();

    const count = Object.keys(currentFilters).length;
    document.getElementById('resultsCountBadge').textContent = `${count} filtro${count !== 1 ? 's' : ''} aplicado${count !== 1 ? 's' : ''}`;
  });

  // Clear filters button
  document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    currentFilters = {};
    clearAdvFilterUI();
    document.querySelectorAll('#quickFilters .filter-chip').forEach(c => c.classList.remove('active'));
    document.querySelector('#quickFilters .filter-chip[data-filter="all"]').classList.add('active');
    document.getElementById('resultsCountBadge').textContent = '0 resultados encontrados';
    currentPage = 1;
    fetchBooks();
  });

  fetchBooks();
});

const clearAdvFilterUI = () => {
  ['filterGenero', 'filterDisponibilidade', 'filterPeriodo', 'filterIdioma', 'filterOrdem'].forEach(id => {
    document.querySelectorAll(`#${id} .filter-chip`).forEach(c => c.classList.remove('active'));
  });
};

const switchSection = (section) => {
  document.getElementById('sectionAcervo').classList.add('d-none');
  document.getElementById('sectionMinhaConta').classList.add('d-none');

  document.getElementById('navAcervo').classList.remove('active');
  document.getElementById('navMinhaConta').classList.remove('active');

  if (section === 'acervo') {
    document.getElementById('sectionAcervo').classList.remove('d-none');
    document.getElementById('navAcervo').classList.add('active');
  } else {
    document.getElementById('sectionMinhaConta').classList.remove('d-none');
    document.getElementById('navMinhaConta').classList.add('active');
    fetchMinhaConta();
  }
};

const logout = async (e) => {
  e?.preventDefault();
  try { await axios.post(`${API_URL}/auth/logout`); } catch (_) {}
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  window.location.href = 'login.html';
};

const fetchBooks = async () => {
  const grid = document.getElementById('booksGrid');
  grid.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary-custom" role="status"><span class="visually-hidden">Carregando...</span></div></div>`;

  const params = new URLSearchParams({ pagina: currentPage, limite: 12 });
  if (currentSearch) params.append('busca', currentSearch);
  Object.entries(currentFilters).forEach(([k, v]) => params.append(k, v));

  try {
    const response = await axios.get(`${API_URL}/books?${params.toString()}`);
    const { data, total, totalPages } = response.data;
    books = data;
    renderBooks(data);
    renderPagination(totalPages);
    document.getElementById('totalBooksText').textContent = `${total} livro${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
    document.getElementById('resultsCountBadge').textContent = `${total} resultado${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
  } catch {
    grid.innerHTML = `<div class="col-12 text-center py-5 text-danger"><i class="bi bi-exclamation-triangle fs-1 mb-3 d-block"></i>Erro ao carregar o acervo.</div>`;
  }
};

const renderBooks = (data) => {
  const grid = document.getElementById('booksGrid');
  if (!data.length) {
    grid.innerHTML = `<div class="col-12 text-center py-5 text-muted"><i class="bi bi-search fs-1 mb-3 d-block"></i>Nenhum livro encontrado.</div>`;
    return;
  }
  const colors = ['#3E2723', '#0B192C', '#1B3C28', '#2D1B2E', '#3E1F24'];

  if (viewMode === 'list') {
    grid.innerHTML = `<div class="col-12"><div class="bg-white rounded-3 border overflow-hidden">${data.map((book, i) => {
      const color = colors[i % colors.length];
      const coverHtml = book.urlCapa
        ? `<img src="${book.urlCapa}" alt="Capa" style="width:48px;height:64px;object-fit:cover;border-radius:4px;">`
        : `<div style="width:48px;height:64px;background:${color};border-radius:4px;display:flex;align-items:center;justify-content:center;"><i class="bi bi-book text-white" style="font-size:1.2rem;opacity:0.6;"></i></div>`;
      const statusBadge = book.disponivel
        ? `<span class="badge bg-success bg-opacity-10 text-success rounded-pill px-2 fw-normal" style="font-size:11px;"><i class="bi bi-check-circle me-1"></i>Disponível</span>`
        : `<span class="badge bg-warning bg-opacity-10 text-warning rounded-pill px-2 fw-normal" style="font-size:11px;"><i class="bi bi-clock me-1"></i>Emprestado</span>`;
      return `
        <div class="d-flex align-items-center gap-3 p-3 border-bottom book-list-item" onclick="openBookDetail('${book._id}')" style="cursor:pointer;">
          ${coverHtml}
          <div class="flex-grow-1 min-width-0">
            <div class="fw-semibold text-dark text-truncate">${book.titulo}</div>
            <div class="text-muted small">${book.autor} · <span class="text-primary-custom">${book.genero}</span></div>
          </div>
          <div class="flex-shrink-0">${statusBadge}</div>
        </div>`;
    }).join('')}</div></div>`;
    return;
  }

  grid.innerHTML = data.map((book, i) => {
    const color = colors[i % colors.length];
    const coverHtml = book.urlCapa
      ? `<img src="${book.urlCapa}" alt="Capa de ${book.titulo}" class="book-cover-img">`
      : `<div class="book-cover-placeholder" style="background-color:${color};"><i class="bi bi-book"></i></div>`;
    const statusBadge = book.disponivel
      ? `<span class="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1 fw-normal"><i class="bi bi-check-circle me-1"></i>Disponível</span>`
      : `<span class="badge bg-warning bg-opacity-10 text-warning rounded-pill px-2 py-1 fw-normal"><i class="bi bi-clock me-1"></i>Emprestado</span>`;
    return `
      <div class="col-12 col-sm-6 col-md-4 col-lg-3">
        <div class="book-card" onclick="openBookDetail('${book._id}')" style="cursor:pointer;">
          ${coverHtml}
          <div class="p-3 d-flex flex-column flex-grow-1">
            <div class="book-category">${book.genero}</div>
            <h3 class="book-title">${book.titulo}</h3>
            <div class="book-author">${book.autor}</div>
            <div class="mt-auto pt-2">${statusBadge}</div>
          </div>
        </div>
      </div>`;
  }).join('');
};

const renderPagination = (totalPages) => {
  const pagination = document.getElementById('pagination');
  if (totalPages <= 1) { pagination.innerHTML = ''; return; }
  let html = `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link rounded-pill px-3 text-dark" href="#" data-page="${currentPage - 1}"><i class="bi bi-arrow-left me-1"></i>Ant.</a></li>`;
  for (let i = 1; i <= totalPages; i++) {
    html += i === currentPage
      ? `<li class="page-item active"><span class="page-link rounded-circle bg-primary-custom border-primary-custom">${i}</span></li>`
      : `<li class="page-item"><a class="page-link rounded-circle text-dark border-0" href="#" data-page="${i}">${i}</a></li>`;
  }
  html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link rounded-pill px-3 text-dark" href="#" data-page="${currentPage + 1}">Próx.<i class="bi bi-arrow-right ms-1"></i></a></li>`;
  pagination.innerHTML = html;
  pagination.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = parseInt(e.currentTarget.dataset.page);
      if (page && page !== currentPage && page > 0 && page <= totalPages) {
        currentPage = page;
        fetchBooks();
        window.scrollTo(0, 0);
      }
    });
  });
};

window.openBookDetail = (id) => {
  const book = books.find(b => b._id === id);
  if (!book) return;

  const cover = document.getElementById('detailCover');
  cover.innerHTML = book.urlCapa
    ? `<img src="${book.urlCapa}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<i class=\\'bi bi-book text-white\\' style=\\'font-size:1.8rem;opacity:0.5;\\'></i>'">`
    : `<i class="bi bi-book text-white" style="font-size:1.8rem;opacity:0.5;"></i>`;

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
  bookDetailModal.show();
};

const fetchMinhaConta = async () => {
  document.getElementById('contaLoading').classList.remove('d-none');
  document.getElementById('contaInfo').classList.add('d-none');
  try {
    const res = await axios.get(`${API_URL}/auth/me`);
    const u = res.data;
    document.getElementById('contaNome').textContent = `${u.nome} ${u.sobrenome}`;
    document.getElementById('contaEmail').textContent = u.email;
    document.getElementById('contaAvatar').textContent = `${u.nome.charAt(0)}${u.sobrenome.charAt(0)}`.toUpperCase();
    document.getElementById('contaRole').textContent = u.role === 'admin' ? 'Administrador' : 'Leitor';
    document.getElementById('contaStatus').innerHTML = `<span class="badge ${u.status === 'Ativo' ? 'badge-ativo' : 'badge-inativo'} px-2 py-1 rounded-pill">${u.status}</span>`;
    document.getElementById('contaConsent').textContent = u.dataConsentimento
      ? new Date(u.dataConsentimento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'Não registrado';
    document.getElementById('contaLoading').classList.add('d-none');
    document.getElementById('contaInfo').classList.remove('d-none');
  } catch {
    document.getElementById('contaLoading').innerHTML = '<p class="text-danger small">Erro ao carregar dados da conta.</p>';
  }
};
