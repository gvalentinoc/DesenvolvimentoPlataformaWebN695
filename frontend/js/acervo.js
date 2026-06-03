const API_URL = 'http://localhost:3000/api';
let currentPage = 1;
let currentFilters = {};
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    document.getElementById('adminBtn').classList.remove('d-none');
    document.getElementById('loginBtnNav').classList.add('d-none');
  }

  setupEventListeners();
  fetchBooks();
});

const setupEventListeners = () => {
  let searchTimeout;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentSearch = e.target.value;
      currentPage = 1;
      fetchBooks();
    }, 500);
  });

  document.querySelectorAll('#quickFilters .filter-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('#quickFilters .filter-chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');

      const filter = e.target.dataset.filter;
      currentFilters = {};

      if (filter !== 'all') {
        const [key, value] = filter.split('=');
        currentFilters[key] = value;
      }

      currentPage = 1;
      fetchBooks();
    });
  });

  const setupFilterGroup = (groupId) => {
    document.querySelectorAll(`#${groupId} .filter-chip`).forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.target.classList.toggle('active');
      });
    });
  };

  setupFilterGroup('filterGenero');
  setupFilterGroup('filterDisponibilidade');
  setupFilterGroup('filterPeriodo');
  setupFilterGroup('filterIdioma');

  document.querySelectorAll('#filterOrdem .filter-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('#filterOrdem .filter-chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
    });
  });

  document.getElementById('applyFiltersBtn').addEventListener('click', () => {
    currentFilters = {};

    const generos = Array.from(document.querySelectorAll('#filterGenero .filter-chip.active')).map(c => c.dataset.value);
    if (generos.length > 0) currentFilters.genero = generos.join(',');

    const idiomas = Array.from(document.querySelectorAll('#filterIdioma .filter-chip.active')).map(c => c.dataset.value);
    if (idiomas.length > 0) currentFilters.idioma = idiomas.join(',');

    const disp = document.querySelector('#filterDisponibilidade .filter-chip.active');
    if (disp) currentFilters.disponivel = disp.dataset.value;

    const ordem = document.querySelector('#filterOrdem .filter-chip.active');
    if (ordem) currentFilters.ordem = ordem.dataset.value;

    document.querySelectorAll('#quickFilters .filter-chip').forEach(c => c.classList.remove('active'));

    currentPage = 1;
    fetchBooks();
  });

  document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    document.querySelectorAll('#advancedFilters .filter-chip').forEach(c => c.classList.remove('active'));
    currentFilters = {};
    currentPage = 1;
    fetchBooks();
  });
};

const fetchBooks = async () => {
  try {
    const grid = document.getElementById('booksGrid');
    grid.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-primary-custom" role="status">
          <span class="visually-hidden">Carregando...</span>
        </div>
      </div>
    `;

    const params = new URLSearchParams({
      pagina: currentPage,
      limite: 12
    });

    if (currentSearch) params.append('busca', currentSearch);

    Object.entries(currentFilters).forEach(([key, value]) => {
      params.append(key, value);
    });

    const response = await axios.get(`${API_URL}/books?${params.toString()}`);
    const { data, total, totalPages } = response.data;

    renderBooks(data);
    renderPagination(totalPages);

    document.getElementById('totalBooksText').textContent = `${total} livros encontrados`;
    document.getElementById('resultsCountBadge').textContent = `${total} resultados encontrados`;

  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    document.getElementById('booksGrid').innerHTML = `
      <div class="col-12 text-center py-5 text-danger">
        <i class="bi bi-exclamation-triangle fs-1 mb-3 d-block"></i>
        Erro ao carregar o acervo. Tente novamente mais tarde.
      </div>
    `;
  }
};

const renderBooks = (books) => {
  const grid = document.getElementById('booksGrid');

  if (books.length === 0) {
    grid.innerHTML = `
      <div class="col-12 text-center py-5 text-muted">
        <i class="bi bi-search fs-1 mb-3 d-block"></i>
        Nenhum livro encontrado com os filtros atuais.
      </div>
    `;
    return;
  }

  const colors = ['#3E2723', '#0B192C', '#1B3C28', '#2D1B2E', '#3E1F24'];

  grid.innerHTML = books.map((book, index) => {
    const color = colors[index % colors.length];
    const coverHtml = book.urlCapa
      ? `<img src="${book.urlCapa}" alt="Capa de ${book.titulo}" class="book-cover-img">`
      : `<div class="book-cover-placeholder" style="background-color: ${color};"><i class="bi bi-book"></i></div>`;

    const statusBadge = book.disponivel
      ? `<span class="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1 fw-normal"><i class="bi bi-check-circle me-1"></i> Disponível</span>`
      : `<span class="badge bg-warning bg-opacity-10 text-warning rounded-pill px-2 py-1 fw-normal"><i class="bi bi-clock me-1"></i> Emprestado</span>`;

    return `
      <div class="col-12 col-sm-6 col-md-4 col-lg-3">
        <a href="livro-detalhe.html?id=${book._id}" class="text-decoration-none">
          <div class="book-card">
            ${coverHtml}
            <div class="p-3 d-flex flex-column flex-grow-1">
              <div class="book-category">${book.genero}</div>
              <h3 class="book-title">${book.titulo}</h3>
              <div class="book-author">${book.autor}</div>
              <div class="mt-auto pt-2">
                ${statusBadge}
              </div>
            </div>
          </div>
        </a>
      </div>
    `;
  }).join('');
};

const renderPagination = (totalPages) => {
  const pagination = document.getElementById('pagination');

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link rounded-pill px-3 text-dark" href="#" data-page="${currentPage - 1}">
        <i class="bi bi-arrow-left me-1"></i> Ant.
      </a>
    </li>
  `;

  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<li class="page-item active"><span class="page-link rounded-circle bg-primary-custom border-primary-custom">${i}</span></li>`;
    } else {
      html += `<li class="page-item"><a class="page-link rounded-circle text-dark border-0" href="#" data-page="${i}">${i}</a></li>`;
    }
  }

  html += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link rounded-pill px-3 text-dark" href="#" data-page="${currentPage + 1}">
        Próx. <i class="bi bi-arrow-right ms-1"></i>
      </a>
    </li>
  `;

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