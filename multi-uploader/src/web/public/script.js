// Global state
let selectedVideo = null;
let platformStatus = {
  youtube: false,
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
  initializeApp();
});

async function initializeApp() {
  await checkPlatformStatus();
  await loadVideos();
  setupEventListeners();
}

// Check platform connection status
async function checkPlatformStatus() {
  try {
    const response = await fetch('/api/status');
    const status = await response.json();
    platformStatus = status;
    updateStatusIndicators(status);

    // Populate YouTube accounts dropdown
    if (status.youtubeAccounts && status.youtubeAccounts.length > 0) {
      populateYouTubeAccounts(status.youtubeAccounts);
    }
  } catch (error) {
    console.error('Failed to check platform status:', error);
  }
}

function updateStatusIndicators(status) {
  Object.keys(status).forEach((platform) => {
    const indicator = document.querySelector(`[data-platform="${platform}"]`);
    if (indicator) {
      indicator.textContent = status[platform] ? '✅' : '❌';
      indicator.className = `status-indicator ${status[platform] ? 'connected' : 'disconnected'}`;
    }
  });
}

function populateYouTubeAccounts(accounts) {
  const select = document.getElementById('youtubeAccount');
  select.innerHTML = '';

  accounts.forEach((account) => {
    const option = document.createElement('option');
    option.value = account;
    option.textContent = `Account ${account}`;
    select.appendChild(option);
  });

  // If no accounts available, show message
  if (accounts.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No YouTube accounts configured';
    option.disabled = true;
    select.appendChild(option);
  }
}

// Load available videos
async function loadVideos() {
  const videoList = document.getElementById('videoList');
  videoList.innerHTML = '<div class="loading">Loading videos...</div>';

  try {
    const response = await fetch('/api/videos');
    const videos = await response.json();

    if (videos.length === 0) {
      videoList.innerHTML = '<div class="loading">No videos found. Upload a video to get started!</div>';
      return;
    }

    videoList.innerHTML = '';
    videos.forEach((video) => {
      const videoItem = createVideoItem(video);
      videoList.appendChild(videoItem);
    });
  } catch (error) {
    console.error('Failed to load videos:', error);
    videoList.innerHTML = '<div class="loading">Failed to load videos</div>';
  }
}

function createVideoItem(video) {
  const item = document.createElement('div');
  item.className = 'video-item';
  item.dataset.path = video.path;

  item.innerHTML = `
        <button class="delete-btn" onclick="deleteVideo('${video.name}')" title="Delete video">×</button>
        <h4>${video.name}</h4>
        <p>📏 Size: ${formatFileSize(video.size)}</p>
        <p>📁 Format: ${video.extension}</p>
        <p>📅 Created: ${new Date().toLocaleDateString()}</p>
    `;

  item.addEventListener('click', (e) => {
    if (!e.target.classList.contains('delete-btn')) {
      selectVideo(video);
    }
  });

  return item;
}

function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

function selectVideo(video) {
  selectedVideo = video;

  // Update UI
  document.querySelectorAll('.video-item').forEach((item) => {
    item.classList.remove('selected');
  });

  document.querySelector(`[data-path="${video.path}"]`).classList.add('selected');

  // Show configuration section
  const configSection = document.getElementById('configSection');
  configSection.style.display = 'block';
  configSection.scrollIntoView({ behavior: 'smooth' });

  // Update selected video display
  const selectedVideoDiv = document.getElementById('selectedVideo');
  selectedVideoDiv.innerHTML = `
        <h3>🎬 Selected Video</h3>
        <p><strong>Name:</strong> ${video.name}</p>
        <p><strong>Size:</strong> ${formatFileSize(video.size)}</p>
        <p><strong>Format:</strong> ${video.extension}</p>
        <p><strong>Path:</strong> ${video.path}</p>
    `;

  // Set default title
  document.getElementById('title').value = video.name.replace(/\.[^/.]+$/, '');
}

async function deleteVideo(filename) {
  if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/videos/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      await loadVideos();

      // Clear selection if deleted video was selected
      if (selectedVideo && selectedVideo.name === filename) {
        selectedVideo = null;
        document.getElementById('configSection').style.display = 'none';
      }
    } else {
      const error = await response.json();
      alert(`Failed to delete video: ${error.error}`);
    }
  } catch (error) {
    console.error('Delete failed:', error);
    alert('Failed to delete video');
  }
}

// Setup event listeners
function setupEventListeners() {
  // File upload
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');

  fileInput.addEventListener('change', handleFileSelect);

  // Drag and drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  });

  // Form submission
  document.getElementById('uploadForm').addEventListener('submit', handleFormSubmit);

  // Platform checkboxes
  document.querySelectorAll('input[name="platforms"]').forEach((checkbox) => {
    checkbox.addEventListener('change', function () {
      const platformOptions = this.closest('.platform-config').querySelector('.platform-options');
      if (platformOptions) {
        platformOptions.style.display = this.checked ? 'block' : 'none';
      }
    });
  });
}

function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length > 0) {
    handleFileUpload(files[0]);
  }
}

async function handleFileUpload(file) {
  // Validate file
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
  if (!allowedTypes.includes(file.type)) {
    alert('File type not supported. Please use MP4, MOV, AVI, MKV, or WebM.');
    return;
  }

  if (file.size > 256 * 1024 * 1024) {
    alert('File too large. Maximum size is 256MB.');
    return;
  }

  // Show progress bar
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');

  progressBar.style.display = 'block';
  progressFill.style.width = '0%';
  progressText.textContent = 'Uploading...';

  // Upload file
  const formData = new FormData();
  formData.append('video', file);

  try {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        progressFill.style.width = percentComplete + '%';
        progressText.textContent = `Uploading... ${Math.round(percentComplete)}%`;
      }
    });

    xhr.addEventListener('load', () => {
      progressBar.style.display = 'none';

      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        loadVideos(); // Refresh video list
        selectVideo(response.video); // Auto-select uploaded video
      } else {
        const error = JSON.parse(xhr.responseText);
        alert(`Upload failed: ${error.error}`);
      }
    });

    xhr.addEventListener('error', () => {
      progressBar.style.display = 'none';
      alert('Upload failed due to network error');
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  } catch (error) {
    progressBar.style.display = 'none';
    console.error('Upload failed:', error);
    alert('Upload failed');
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();

  if (!selectedVideo) {
    alert('Please select a video first');
    return;
  }

  // Get form data
  const formData = new FormData(e.target);
  const platforms = Array.from(document.querySelectorAll('input[name="platforms"]:checked')).map((cb) => cb.value);

  if (platforms.length === 0) {
    alert('Please select at least one platform');
    return;
  }

  const uploadData = {
    videoPath: selectedVideo.path,
    platforms: platforms,
    title: formData.get('title'),
    description: formData.get('description'),
    hashtags: formData.get('hashtags'),
    youtubeAccount: formData.get('youtubeAccount') || 'A', // Default to A if not specified
    schedules: {
      youtube: formData.get('youtubeSchedule') || null,
    },
  };

  try {
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '🔄 Uploading...';
    submitBtn.disabled = true;

    const response = await fetch('/api/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uploadData),
    });

    const result = await response.json();

    // Reset button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    // Show results
    showResults(result.results);
  } catch (error) {
    console.error('Upload failed:', error);
    alert('Upload failed');

    // Reset button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.textContent = '🚀 Upload';
    submitBtn.disabled = false;
  }
}

function showResults(results) {
  const resultsSection = document.getElementById('resultsSection');
  const resultsContent = document.getElementById('resultsContent');

  resultsContent.innerHTML = '';

  Object.keys(results).forEach((platform) => {
    const result = results[platform];
    const resultItem = document.createElement('div');
    resultItem.className = `result-item ${result.success ? 'success' : 'error'}`;

    const platformNames = {
      youtube: 'YouTube',
    };

    resultItem.innerHTML = `
            <h4>${result.success ? '✅' : '❌'} ${platformNames[platform]}${
      platform === 'youtube' && result.account ? ` (Account ${result.account})` : ''
    }</h4>
            ${
              result.success
                ? `
                <p><strong>Video ID:</strong> ${result.videoId}</p>
                <p><strong>URL:</strong> <a href="${result.url}" target="_blank">${result.url}</a></p>
                ${
                  result.scheduledTime
                    ? `<p><strong>Scheduled for:</strong> ${new Date(result.scheduledTime).toLocaleString()}</p>`
                    : ''
                }
            `
                : `
                <p><strong>Error:</strong> ${result.error}</p>
            `
            }
        `;

    resultsContent.appendChild(resultItem);
  });

  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Preview functionality
function previewUpload() {
  if (!selectedVideo) {
    alert('Please select a video first');
    return;
  }

  const formData = new FormData(document.getElementById('uploadForm'));
  const platforms = Array.from(document.querySelectorAll('input[name="platforms"]:checked')).map((cb) => cb.value);

  if (platforms.length === 0) {
    alert('Please select at least one platform');
    return;
  }

  const previewData = {
    video: selectedVideo,
    title: formData.get('title') || 'Untitled',
    description: formData.get('description') || 'No description',
    hashtags: formData.get('hashtags') || 'No hashtags',
    platforms: platforms,
    youtubeAccount: formData.get('youtubeAccount') || 'A',
    schedules: {
      youtube: formData.get('youtubeSchedule'),
    },
  };

  showPreviewModal(previewData);
}

function showPreviewModal(data) {
  const modal = document.getElementById('previewModal');
  const previewContent = document.getElementById('previewContent');

  previewContent.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h4>🎬 Video</h4>
            <p><strong>Name:</strong> ${data.video.name}</p>
            <p><strong>Size:</strong> ${formatFileSize(data.video.size)}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4>📝 Content</h4>
            <p><strong>Title:</strong> ${data.title}</p>
            <p><strong>Description:</strong> ${data.description}</p>
            <p><strong>Hashtags:</strong> ${data.hashtags}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4>📱 Platforms</h4>
            ${data.platforms
              .map((platform) => {
                const schedule = data.schedules[platform];
                const platformNames = { youtube: 'YouTube' };
                return `
                    <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                        <strong>${platformNames[platform]}${
                  platform === 'youtube' ? ` (Account ${data.youtubeAccount})` : ''
                }</strong>
                        ${
                          schedule
                            ? `<br>⏰ Scheduled: ${new Date(schedule).toLocaleString()}`
                            : '<br>🚀 Immediate upload'
                        }
                    </div>
                `;
              })
              .join('')}
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
            <strong>ℹ️ Note:</strong> Only YouTube uploads are supported. 
            YouTube uploads will work directly from local files.
        </div>
    `;

  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('previewModal').style.display = 'none';
}

function confirmUpload() {
  closeModal();
  document.getElementById('uploadForm').dispatchEvent(new Event('submit'));
}

// Set minimum datetime for scheduling (current time + 10 minutes)
function setMinScheduleTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  const minDateTime = now.toISOString().slice(0, 16);

  document.querySelectorAll('input[type="datetime-local"]').forEach((input) => {
    input.min = minDateTime;
  });
}

// Initialize minimum schedule times when page loads
document.addEventListener('DOMContentLoaded', setMinScheduleTime);
