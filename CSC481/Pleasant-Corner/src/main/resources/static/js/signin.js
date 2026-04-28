document.querySelector('input[type="password"]').addEventListener('dblclick', function () {
  this.type = this.type === 'password' ? 'text' : 'password';
});

document.querySelector('.btn-signin').addEventListener('click', function () {
  this.textContent = 'Signing in\u2026';
  setTimeout(() => { this.textContent = 'Sign into Dashboard'; }, 1800);
});