const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : 'https://desenvolvimentoplataformawebn695-production.up.railway.app/api';

// Toggle Password Visibility
const togglePassword = document.querySelector('#togglePassword');
const password = document.querySelector('#senha');

if (togglePassword && password) {
  togglePassword.addEventListener('click', function () {
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    this.querySelector('i').classList.toggle('bi-eye');
    this.querySelector('i').classList.toggle('bi-eye-slash');
  });
}

const toggleConfirmPassword = document.querySelector('#toggleConfirmPassword');
const confirmPassword = document.querySelector('#confirmarSenha');

if (toggleConfirmPassword && confirmPassword) {
  toggleConfirmPassword.addEventListener('click', function () {
    const type = confirmPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPassword.setAttribute('type', type);
    this.querySelector('i').classList.toggle('bi-eye');
    this.querySelector('i').classList.toggle('bi-eye-slash');
  });
}

// Show Alert
const showAlert = (message, type) => {
  const alertEl = document.getElementById('alertMessage');
  if (alertEl) {
    alertEl.textContent = message;
    alertEl.className = `alert alert-${type}`;
    alertEl.classList.remove('d-none');
  }
};

// Login Form Submit
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const btn = document.getElementById('loginBtn');
    
    try {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Entrando...';
      
      const response = await axios.post(`${API_URL}/auth/login`, { email, senha });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      window.location.href = 'admin.html';
    } catch (error) {
      showAlert(error.response?.data?.message || 'Erro ao fazer login', 'danger');
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  });
}

// Register Form Submit
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const sobrenome = document.getElementById('sobrenome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const lgpdConsent = document.getElementById('lgpdConsent').checked;
    const btn = document.getElementById('registerBtn');
    
    if (senha !== confirmarSenha) {
      document.getElementById('confirmarSenha').classList.add('is-invalid');
      return;
    } else {
      document.getElementById('confirmarSenha').classList.remove('is-invalid');
    }
    
    try {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Criando conta...';
      
      await axios.post(`${API_URL}/auth/register`, {
        nome, sobrenome, email, senha, lgpdConsent
      });
      
      // Redirect to success screen instead of auto-login
      window.location.href = 'sucesso.html';
    } catch (error) {
      // Handle duplicate email error specifically
      if (error.response && error.response.status === 400 && error.response.data.message === 'Usuário já existe') {
        showAlert('Este e-mail já está cadastrado. Por favor, faça login ou use outro e-mail.', 'danger');
      } else {
        showAlert(error.response?.data?.message || 'Erro ao criar conta', 'danger');
      }
      btn.disabled = false;
      btn.textContent = 'Criar conta';
    }
  });
}
