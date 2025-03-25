// Ensure PDF.js is loaded correctly
if (typeof pdfjsLib === 'undefined') {
    pdfjsLib = window.pdfjsLib;
}

// Initialize PDF.js Worker
if (pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.min.js';
}

// Main DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const pdfPreview = document.getElementById('pdfPreview');
const conversionOptions = document.getElementById('conversionOptions');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const resultArea = document.getElementById('resultArea');
const downloadOptions = document.getElementById('downloadOptions');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const imageQuality = document.getElementById('imageQuality');
const toastContainer = document.getElementById('toastContainer');

// Global variables
let currentPdfFile = null;
let pdfDocument = null;
let pdfPages = 0;
let convertedImages = [];
let isConverting = false;

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Drag and drop events
    setupDragAndDrop();
    
    // File selection event
    fileInput.addEventListener('change', handleFileSelect);
    
    // Convert button click event
    convertBtn.addEventListener('click', convertPdfToImages);
    
    // Clear button click event
    clearBtn.addEventListener('click', clearAll);
    
    // Download button click event
    downloadAllBtn.addEventListener('click', downloadAllImages);
});

// Setup drag and drop functionality
function setupDragAndDrop() {
    // Prevent browser default behavior
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    uploadArea.addEventListener('drop', handleDrop, false);
}

// Prevent defaults
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight upload area
function highlight() {
    uploadArea.classList.add('highlight');
}

// Remove highlight from upload area
function unhighlight() {
    uploadArea.classList.remove('highlight');
}

// Handle dropped files
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        // Only process the first file
        const file = files[0];
        if (file.type === 'application/pdf') {
            handlePdfFile(file);
        } else {
            showToast('Please upload a PDF file', 'error');
        }
    }
}

// Handle file selection
function handleFileSelect(e) {
    const files = e.target.files;
    
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf') {
            handlePdfFile(file);
        } else {
            showToast('Please upload a PDF file', 'error');
        }
    }
}

// Process PDF file
async function handlePdfFile(file) {
    try {
        // If the file is too large, show a warning
        if (file.size > 200 * 1024 * 1024) { // 200MB
            showToast('File is large, conversion may take longer', 'warning');
        }
        
        // Store current PDF file
        currentPdfFile = file;
        
        // Load PDF file
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        
        pdfDocument = await loadingTask.promise;
        pdfPages = pdfDocument.numPages;
        
        // Display PDF basic information
        showPdfInfo(file, pdfDocument);
        
        // Show conversion options
        conversionOptions.style.display = 'block';
        
        // Show control buttons area
        document.querySelector('.controls').style.display = 'flex';
        
        // Activate convert and clear buttons
        convertBtn.disabled = false;
        clearBtn.disabled = false;
        
        showToast('PDF file loaded successfully, starting automatic conversion', 'success');
        
        // Start conversion automatically
        convertPdfToImages();
    } catch (error) {
        console.error('PDF loading error:', error);
        showToast('PDF file loading failed, please check if the file is valid', 'error');
    }
}

// Only show PDF basic info, no preview
function showPdfInfo(file, pdfDoc) {
    // Clear preview area
    pdfPreview.innerHTML = '';
    
    // Create PDF info area
    const pdfInfo = document.createElement('div');
    pdfInfo.className = 'pdf-info';
    
    // Left side info
    const pdfInfoLeft = document.createElement('div');
    pdfInfoLeft.className = 'pdf-info-left';
    
    // PDF icon
    const pdfIcon = document.createElement('div');
    pdfIcon.className = 'pdf-icon';
    pdfIcon.innerHTML = '<i class="material-icons">picture_as_pdf</i>';
    
    // Add file loading animation
    pdfIcon.style.transform = 'scale(0.8)';
    pdfIcon.style.opacity = '0';
    
    // PDF details
    const pdfDetails = document.createElement('div');
    pdfDetails.className = 'pdf-details';
    pdfDetails.innerHTML = `
        <h4>${file.name}</h4>
        <p>${formatFileSize(file.size)} | ${pdfDoc.numPages} pages</p>
    `;
    
    // Detail animation preparation
    pdfDetails.style.transform = 'translateY(10px)';
    pdfDetails.style.opacity = '0';
    
    pdfInfoLeft.appendChild(pdfIcon);
    pdfInfoLeft.appendChild(pdfDetails);
    pdfInfo.appendChild(pdfInfoLeft);
    
    // Add to preview area
    pdfPreview.appendChild(pdfInfo);
    pdfPreview.style.display = 'block';
    
    // Apply entrance animation
    setTimeout(() => {
        pdfIcon.style.transition = 'all 0.5s ease';
        pdfIcon.style.transform = 'scale(1)';
        pdfIcon.style.opacity = '1';
        
        setTimeout(() => {
            pdfDetails.style.transition = 'all 0.5s ease';
            pdfDetails.style.transform = 'translateY(0)';
            pdfDetails.style.opacity = '1';
        }, 200);
    }, 100);
}

// Create page thumbnail
async function createPageThumbnail(page, pageNumber) {
    const viewport = page.getViewport({ scale: 0.3 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Render page to canvas
    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;
    
    // Create thumbnail container
    const thumbnail = document.createElement('div');
    thumbnail.className = 'page-thumbnail';
    
    // Convert canvas to image
    const img = document.createElement('img');
    img.src = canvas.toDataURL();
    thumbnail.appendChild(img);
    
    // Add page number
    const pageNumberDiv = document.createElement('div');
    pageNumberDiv.className = 'page-number';
    pageNumberDiv.textContent = `Page ${pageNumber}`;
    thumbnail.appendChild(pageNumberDiv);
    
    return thumbnail;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Convert PDF to images
async function convertPdfToImages() {
    if (!pdfDocument || isConverting) return;
    
    try {
        isConverting = true;
        convertedImages = [];
        
        // Hide convert button, emphasize clear button
        convertBtn.style.display = 'none';
        clearBtn.style.flex = '1';
        
        // Show conversion status
        showConvertingStatus();
        
        // Use fixed high-quality settings
        const format = 'jpg'; // Fixed jpg format
        const quality = 1.0; // Highest quality 100%
        const dpi = 300; // Highest resolution DPI
        
        // Calculate scale
        const scale = dpi / 72; // 72 is the default PDF DPI
        
        // Show conversion progress
        updateConvertingStatus(`Initializing conversion engine...`, 0);
        await sleep(500); // Small delay to make UI updates visible
        
        // Convert page by page
        let processedPages = 0;
        
        // First prepare all pages to avoid repeated loading
        updateConvertingStatus(`Analyzing PDF document...`, 5);
        await sleep(300);
        
        // Add some random waiting time to make progress more natural
        updateConvertingStatus(`Preparing to convert ${pdfPages} pages...`, 10);
        await sleep(500);
        
        for (let i = 1; i <= pdfPages; i++) {
            try {
                updateConvertingStatus(`Processing page ${i}...`, (processedPages / pdfPages) * 80 + 10);
                
                const page = await pdfDocument.getPage(i);
                const imageData = await renderPageToImage(page, scale, format, quality);
                
                convertedImages.push({
                    pageNumber: i,
                    data: imageData,
                    format: format
                });
                
                processedPages++;
                const progressPercentage = (processedPages / pdfPages) * 80 + 10; // 10-90% progress range
                updateConvertingStatus(`Converted ${processedPages}/${pdfPages} pages`, progressPercentage);
                
                // For long documents, reduce delay between pages
                if (pdfPages > 10) {
                    await sleep(50);
                } else {
                    await sleep(100); // Shorter documents can have more natural delay
                }
            } catch (error) {
                console.error(`Error converting page ${i}:`, error);
                showToast(`Error converting page ${i}`, 'error');
            }
        }
        
        // Finish conversion, process results
        updateConvertingStatus(`Organizing conversion results...`, 90);
        await sleep(500);
        
        updateConvertingStatus(`Conversion complete, preparing preview...`, 95);
        await sleep(300);
        
        // Conversion complete
        hideConvertingStatus();
        
        if (convertedImages.length > 0) {
            showToast(`Conversion complete, ${convertedImages.length} pages available for download`, 'success');
            displayResults();
        } else {
            showToast('Conversion failed, no images were generated', 'error');
        }
    } catch (error) {
        console.error('Error in conversion process:', error);
        showToast('Error during conversion process', 'error');
        hideConvertingStatus();
    } finally {
        isConverting = false;
    }
}

// Helper function: wait for specified milliseconds
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Render page to image
async function renderPageToImage(page, scale, format, quality) {
    const viewport = page.getViewport({ scale: scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Set background to white
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Render page to canvas
    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;
    
    // Convert canvas to image data
    return format === 'jpg' 
        ? canvas.toDataURL('image/jpeg', quality) 
        : canvas.toDataURL('image/png');
}

// Show converting status
function showConvertingStatus() {
    // Clear any existing status elements
    const existingStatus = document.querySelector('.converting-status');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    // Create conversion status element
    const convertingStatus = document.createElement('div');
    convertingStatus.className = 'converting-status';
    convertingStatus.style.display = 'block';
    convertingStatus.innerHTML = `
        <div class="section-title pulse-effect">
            <i class="material-icons">autorenew</i>
            <h3>Converting</h3>
        </div>
        <div class="spinner"></div>
        <p class="status-text" id="statusText">Preparing conversion...</p>
        <div class="page-counter" id="pageCounter">0/${pdfPages} pages</div>
        <div class="progress-container">
            <div class="progress-bar" id="convertProgress"></div>
        </div>
        <p class="conversion-note">Conversion process may take some time, please be patient</p>
    `;
    
    // Insert after controls button
    const controls = document.querySelector('.controls');
    controls.parentNode.insertBefore(convertingStatus, controls.nextSibling);
    
    // Disable convert button
    convertBtn.disabled = true;
    
    // Scroll to status area
    convertingStatus.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Update conversion status
function updateConvertingStatus(text, percentage) {
    const statusText = document.getElementById('statusText');
    const progressBar = document.getElementById('convertProgress');
    const pageCounter = document.getElementById('pageCounter');
    
    if (statusText && progressBar) {
        statusText.textContent = text;
        progressBar.style.width = `${percentage}%`;
        
        // Update page counter
        if (pageCounter) {
            const processedPages = Math.round((percentage / 100) * pdfPages);
            pageCounter.textContent = `${processedPages}/${pdfPages} pages`;
        }
        
        // Update status text when progress is near completion
        if (percentage > 95) {
            statusText.textContent = "Finishing conversion...";
        }
    }
}

// Hide conversion status
function hideConvertingStatus() {
    const convertingStatus = document.querySelector('.converting-status');
    if (convertingStatus) {
        // Update final status
        const statusText = document.getElementById('statusText');
        const progressBar = document.getElementById('convertProgress');
        const pageCounter = document.getElementById('pageCounter');
        
        if (statusText && progressBar && pageCounter) {
            statusText.textContent = "Conversion complete!";
            progressBar.style.width = "100%";
            pageCounter.textContent = `${pdfPages}/${pdfPages} pages`;
        }
        
        // Add success animation
        const spinner = convertingStatus.querySelector('.spinner');
        if (spinner) {
            spinner.style.borderTopColor = '#2ecc71';
            spinner.style.borderLeftColor = '#2ecc71';
            spinner.style.animation = 'none';
            spinner.innerHTML = '<i class="material-icons" style="font-size: 36px; color: #2ecc71; line-height: 64px;">check_circle</i>';
        }
        
        // Fade out after delay
        setTimeout(() => {
            convertingStatus.style.opacity = '0';
            convertingStatus.style.transition = 'opacity 0.5s ease';
            
            // Remove after further delay
            setTimeout(() => {
                convertingStatus.remove();
            }, 500);
        }, 1000);
    }
    
    // Enable convert button
    convertBtn.disabled = false;
}

// Display conversion results
function displayResults() {
    // Clear result area
    resultArea.innerHTML = '';
    
    // Add result title
    const resultTitle = document.createElement('div');
    resultTitle.className = 'section-title';
    resultTitle.innerHTML = `<i class="material-icons">check_circle</i><h3>Conversion Complete (${convertedImages.length} pages)</h3>`;
    resultArea.appendChild(resultTitle);
    
    // Create result items
    for (const image of convertedImages) {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        // Image
        const img = document.createElement('img');
        img.src = image.data;
        img.alt = `Page ${image.pageNumber}`;
        img.addEventListener('click', () => downloadSingleImage(image));
        resultItem.appendChild(img);
        
        // Page info
        const pageInfo = document.createElement('div');
        pageInfo.className = 'page-info';
        pageInfo.innerHTML = `<span>Page ${image.pageNumber}</span> <i class="material-icons download-icon">download</i>`;
        
        // Add download event
        pageInfo.querySelector('.download-icon').addEventListener('click', (e) => {
            e.stopPropagation();
            downloadSingleImage(image);
        });
        
        resultItem.appendChild(pageInfo);
        
        // Add to result area
        resultArea.appendChild(resultItem);
    }
    
    // Show download options
    downloadOptions.style.display = 'flex';
    
    // Auto-scroll to download options
    downloadOptions.scrollIntoView({ behavior: 'smooth' });
    
    // Highlight download button
    downloadAllBtn.classList.add('highlight-btn');
    setTimeout(() => {
        downloadAllBtn.classList.remove('highlight-btn');
    }, 2000);
}

// Image preview
function previewImage(image) {
    // Check if preview modal already exists
    let previewModal = document.getElementById('previewModal');
    
    if (!previewModal) {
        // Create preview modal
        previewModal = document.createElement('div');
        previewModal.id = 'previewModal';
        previewModal.className = 'preview-modal';
        previewModal.style.position = 'fixed';
        previewModal.style.top = '0';
        previewModal.style.left = '0';
        previewModal.style.width = '100%';
        previewModal.style.height = '100%';
        previewModal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        previewModal.style.display = 'flex';
        previewModal.style.alignItems = 'center';
        previewModal.style.justifyContent = 'center';
        previewModal.style.zIndex = '1000';
        previewModal.style.opacity = '0';
        previewModal.style.transition = 'opacity 0.3s ease';
        
        // Click background to close preview
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                closePreview();
            }
        });
        
        document.body.appendChild(previewModal);
    }
    
    // Set preview content
    previewModal.innerHTML = `
        <div style="max-width: 90%; max-height: 90%; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); position: relative;">
            <img src="${image.data}" style="max-width: 100%; max-height: calc(90vh - 80px); display: block; object-fit: contain;">
            <div style="padding: 15px; display: flex; justify-content: space-between; align-items: center; background: #f1f8e9; border-top: 1px solid #c8e6c9;">
                <div style="font-size: 0.9rem; color: #424242;">
                    Page ${image.pageNumber} | JPG Format | 300 DPI | Original Quality
                </div>
                <div>
                    <button id="downloadPreviewBtn" style="background: linear-gradient(135deg, #4caf50, #2e7d32); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                        <i class="material-icons" style="font-size: 18px;">download</i> Download This Image
                    </button>
                </div>
            </div>
            <div style="position: absolute; top: 15px; right: 15px; width: 30px; height: 30px; background: rgba(0, 0, 0, 0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;" id="closePreviewBtn">
                <i class="material-icons" style="color: white; font-size: 20px;">close</i>
            </div>
        </div>
    `;
    
    // Show preview
    setTimeout(() => {
        previewModal.style.opacity = '1';
    }, 10);
    
    // Add download event
    document.getElementById('downloadPreviewBtn').addEventListener('click', () => {
        downloadSingleImage(image);
    });
    
    // Add close event
    document.getElementById('closePreviewBtn').addEventListener('click', closePreview);
    
    // Prevent scrolling
    document.body.style.overflow = 'hidden';
}

// Close preview
function closePreview() {
    const previewModal = document.getElementById('previewModal');
    
    if (previewModal) {
        previewModal.style.opacity = '0';
        
        // Remove after delay
        setTimeout(() => {
            previewModal.remove();
            // Restore scrolling
            document.body.style.overflow = '';
        }, 300);
    }
}

// Download single image
function downloadSingleImage(image) {
    const fileName = getFileName(currentPdfFile.name, image.pageNumber, image.format);
    
    // Create download link
    const link = document.createElement('a');
    link.href = image.data;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download all images in bulk
async function downloadAllImages() {
    if (!convertedImages.length) return;
    
    try {
        // Show loading status
        showToast('Preparing download...', 'info');
        
        // Load JSZip library
        if (typeof JSZip === 'undefined') {
            await loadJSZip();
        }
        
        const zip = new JSZip();
        const folder = zip.folder('images');
        
        // Add all images to zip
        convertedImages.forEach(image => {
            const fileName = getFileName('page', image.pageNumber, image.format);
            const dataURL = image.data;
            const base64Data = dataURL.split(',')[1];
            folder.file(fileName, base64Data, { base64: true });
        });
        
        // Generate zip file
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        // Download zip file
        const zipFileName = getZipFileName(currentPdfFile.name);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = zipFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Download started', 'success');
    } catch (error) {
        console.error('Bulk download error:', error);
        showToast('Bulk download failed', 'error');
    }
}

// Load JSZip library
function loadJSZip() {
    return new Promise((resolve, reject) => {
        if (typeof JSZip !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'libs/jszip.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Unable to load JSZip library'));
        document.head.appendChild(script);
    });
}

// Get file name
function getFileName(baseName, pageNumber, format) {
    // Remove extension
    const nameWithoutExt = baseName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}_page${pageNumber}.${format}`;
}

// Get ZIP file name
function getZipFileName(baseName) {
    // Remove extension
    const nameWithoutExt = baseName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}_images.zip`;
}

// Clear all
function clearAll() {
    // Reset form
    fileInput.value = '';
    
    // Reset preview and result areas
    pdfPreview.innerHTML = '';
    pdfPreview.style.display = 'none';
    resultArea.innerHTML = '';
    
    // Hide options and download areas
    conversionOptions.style.display = 'none';
    downloadOptions.style.display = 'none';
    
    // Hide control buttons area
    document.querySelector('.controls').style.display = 'none';
    
    // Reset button status
    convertBtn.disabled = true;
    clearBtn.disabled = true;
    
    // Restore convert button display and style
    convertBtn.style.display = '';
    clearBtn.style.flex = '';
    
    // Reset variables
    currentPdfFile = null;
    pdfDocument = null;
    pdfPages = 0;
    convertedImages = [];
    
    showToast('All content cleared', 'info');
}

// Show toast message
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon
    let icon = 'info';
    switch (type) {
        case 'success': icon = 'check_circle'; break;
        case 'error': icon = 'error'; break;
        case 'warning': icon = 'warning'; break;
        default: icon = 'info';
    }
    
    toast.innerHTML = `
        <i class="material-icons" style="color: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};">${icon}</i>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
        <span class="toast-close" onclick="this.parentElement.remove();">
            <i class="material-icons" style="font-size: 18px;">close</i>
        </span>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Show Toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
} 