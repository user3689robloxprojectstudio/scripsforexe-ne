document.addEventListener('DOMContentLoaded', async () => {
  const user = await fetchCurrentUser();
  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  const fileInput = document.getElementById('script-file');
  const dropzone = document.getElementById('dropzone');
  const selectBtn = document.getElementById('select-file-btn');
  const selectedName = document.getElementById('selected-file-name');
  const form = document.getElementById('upload-form');
  const progressBar = document.getElementById('progress-bar');
  const progressFill = progressBar.querySelector('span');

  let selectedFile = null;

  function setProgress(value) {
    progressBar.classList.remove('hidden');
    progressFill.style.width = `${value}%`;
    if (value >= 100) {
      setTimeout(() => progressBar.classList.add('hidden'), 500);
    }
  }

  function handleSelectedFile(file) {
    selectedFile = null;
    if (!file) return;
    if (!/\.(lua|txt)$/i.test(file.name)) {
      showToast('Only .lua and .txt text files are allowed.', 'error');
      return;
    }

    if (file.size === 0) {
      showToast('The selected file is empty.', 'error');
      selectedName.textContent = 'No file selected';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('File size must be under 2 MB.', 'error');
      selectedName.textContent = 'No file selected';
      return;
    }

    selectedFile = file;
    selectedName.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    showToast(`${file.name} ready to upload.`, 'success');
  }

  fileInput.addEventListener('change', (event) => handleSelectedFile(event.target.files[0]));
  selectBtn.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (event) => {
    const file = event.dataTransfer.files[0];
    handleSelectedFile(file);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      showToast('Please choose a .lua or .txt file before uploading.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', document.getElementById('title').value.trim());
    formData.append('description', document.getElementById('description').value.trim());
    formData.append('tags', document.getElementById('tags').value.trim());
    formData.append('visibility', document.getElementById('visibility').value);

    setProgress(20);
    const uploadButton = document.getElementById('upload-button');
    uploadButton.disabled = true;
    uploadButton.textContent = 'Uploading...';

    try {
      const response = await apiFetch('/api/scripts', {
        method: 'POST',
        body: formData
      });

      setProgress(100);
      showToast('Script uploaded successfully.', 'success');
      setTimeout(() => {
        window.location.href = '/scripts.html';
      }, 600);
    } catch (error) {
      setProgress(0);
      showToast(error.message, 'error');
    } finally {
      uploadButton.disabled = false;
      uploadButton.textContent = 'Upload Script';
    }
  });
});
