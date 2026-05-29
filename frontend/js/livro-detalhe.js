const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('id');
  
  if (!bookId) {
    window.location.href = 'acervo.html';
    return;
  }
  
  fetchBookDetails(bookId);
});

const fetchBookDetails = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/books/${id}`);
    renderBookDetails(response.data);
  } catch (error) {
    console.error('Erro ao buscar detalhes do livro:', error);
    document.getElementById('bookDetailContainer').innerHTML = `
      <div class="alert alert-danger text-center">
        <i class="bi bi-exclamation-triangle fs-4 d-block mb-2"></i>
        Livro não encontrado ou erro ao carregar os dados.
        <br><br>
        <a href="acervo.html" class="btn btn-outline-danger btn-sm">Voltar ao acervo</a>
      </div>
    `;
  }
};

const renderBookDetails = (book) => {
  const container = document.getElementById('bookDetailContainer');
  const token = localStorage.getItem('token');
  
  const coverHtml = book.urlCapa 
    ? `<img src="${book.urlCapa}" alt="Capa de ${book.titulo}" class="book-detail-cover">`
    : `<div class="book-detail-placeholder bg-dark"><i class="bi bi-book"></i></div>`;
    
  const statusBadge = book.disponivel
    ? `<span class="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fw-normal me-2"><i class="bi bi-check-circle me-1"></i> Disponível (${book.numeroExemplares} ex.)</span>`
    : `<span class="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-2 fw-normal me-2"><i class="bi bi-clock me-1"></i> Indisponível</span>`;

  // Only show reserve button if available AND user is logged in
  let reserveBtnHtml = '';
  if (book.disponivel) {
    if (token) {
      reserveBtnHtml = `<button class="btn btn-primary-custom px-4 py-2 w-100 w-sm-auto" onclick="alert('Reserva solicitada com sucesso!')"><i class="bi bi-bookmark me-2"></i> Reservar livro</button>`;
    } else {
      reserveBtnHtml = `<a href="login.html" class="btn btn-outline-primary-custom px-4 py-2 w-100 w-sm-auto"><i class="bi bi-box-arrow-in-right me-2"></i> Faça login para reservar</a>`;
    }
  } else {
    reserveBtnHtml = `<button class="btn btn-secondary px-4 py-2 w-100 w-sm-auto" disabled><i class="bi bi-slash-circle me-2"></i> Indisponível no momento</button>`;
  }

  container.innerHTML = `
    <div class="book-detail-card">
      <div class="row g-5">
        <div class="col-md-4 col-lg-3 text-center text-md-start">
          ${coverHtml}
        </div>
        <div class="col-md-8 col-lg-9">
          <h1 class="fw-bold text-dark mb-1">${book.titulo}</h1>
          <h4 class="text-muted fw-normal mb-4">${book.autor}</h4>
          
          <div class="d-flex flex-wrap align-items-center mb-4">
            ${statusBadge}
            <span class="badge bg-light text-dark border rounded-pill px-3 py-2 fw-normal">${book.genero}</span>
          </div>
          
          <div class="d-flex flex-wrap mb-4 border-bottom pb-4">
            <div class="metadata-badge">
              <i class="bi bi-upc-scan"></i> ${book.isbn}
            </div>
            <div class="metadata-badge">
              <i class="bi bi-calendar3"></i> ${book.anoPublicacao}
            </div>
            <div class="metadata-badge">
              <i class="bi bi-file-earmark-text"></i> ${book.paginas} págs.
            </div>
            <div class="metadata-badge">
              <i class="bi bi-translate"></i> ${book.idioma}
            </div>
          </div>
          
          <h5 class="fw-bold mb-3">Sinopse</h5>
          <p class="synopsis-text mb-5">${book.sinopse.replace(/\n/g, '<br>')}</p>
          
          <div class="d-flex flex-column flex-sm-row gap-3">
            ${reserveBtnHtml}
            <button class="btn btn-outline-secondary px-4 py-2 w-100 w-sm-auto" onclick="this.classList.toggle('text-danger'); this.querySelector('i').classList.toggle('bi-heart'); this.querySelector('i').classList.toggle('bi-heart-fill');">
              <i class="bi bi-heart me-2"></i> Favoritar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
};
