function saveOptions() {
  const token = document.querySelector('.token').value;

  chrome.storage.sync.set({token}, () => {
    const status = document.querySelector('.status');
    status.textContent = 'Options saved.';

    setTimeout(() => {status.textContent = '';}, 750);
  });
}


function restoreOptions() {
  chrome.storage.sync.get({token: ''}, items => {
    document.querySelector('.token').value = items.token;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('.save').addEventListener('click', saveOptions);
