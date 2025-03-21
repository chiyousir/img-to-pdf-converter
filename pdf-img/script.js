// Ensure PDF.js is properly loaded
if (typeof pdfjsLib === 'undefined') {
    pdfjsLib = window.pdfjsLib;
}

// Initialize PDF.js Worker
if (pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.5.141/pdf.worker.min.js';
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
    
    // File selection events
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
    });
    
    // Highlight drop area
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    // Remove highlight
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle drop
    uploadArea.addEventListener('drop', handleDrop, false);
    
    // Handle click on upload area
    uploadArea.addEventListener('click', (e) => {
        if (e.target === uploadArea || e.target.closest('.upload-btn')) {
            fileInput.click();
        }
    });
}

// Prevent default browser behaviors
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop area
function highlight() {
    uploadArea.classList.add('highlight');
}

// Remove highlight from drop area
function unhighlight() {
    uploadArea.classList.remove('highlight');
}

// Handle file drop
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        // Only accept the first file
        const file = files[0];
        
        if (file.type === 'application/pdf') {
            handlePdfFile(file);
        } else {
            showToast('Please select a PDF file', 'error');
        }
    }
}

// Handle file selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    
    if (file) {
        if (file.type === 'application/pdf') {
            handlePdfFile(file);
        } else {
            showToast('Please select a PDF file', 'error');
        }
        // Reset input value to allow selecting the same file again
        fileInput.value = '';
    }
}

// Process PDF file
async function handlePdfFile(file) {
    try {
        // Clear previous PDF
        if (currentPdfFile) {
            clearAll();
        }
        
        currentPdfFile = file;
        
        // Check file size
        if (file.size > 200 * 1024 * 1024) { // 200MB limit
            showToast('File is too large. Maximum size is 200MB', 'error');
            return;
        }
        
        // Show loading toast
        showToast('Loading PDF file...', 'info');
        
        // Load PDF using PDF.js
        const fileReader = new FileReader();
        fileReader.onload = async function(e) {
            try {
                const typedArray = new Uint8Array(e.target.result);
                pdfDocument = await pdfjsLib.getDocument({ data: typedArray }).promise;
                pdfPages = pdfDocument.numPages;
                
                // Show PDF information
                showPdfInfo(file, pdfDocument);
                
                // Show conversion options
                conversionOptions.style.display = 'block';
                
                // Enable convert button
                convertBtn.disabled = false;
                clearBtn.disabled = false;
                
                showToast('PDF loaded successfully', 'success');
            } catch (err) {
                console.error('Error loading PDF:', err);
                showToast('Failed to load PDF file: ' + err.message, 'error');
            }
        };
        fileReader.readAsArrayBuffer(file);
    } catch (error) {
        console.error('Error handling PDF file:', error);
        showToast('Error processing PDF file: ' + error.message, 'error');
    }
}

// Display PDF information and thumbnails
function showPdfInfo(file, pdfDoc) {
    pdfPreview.innerHTML = '';
    
    // Create PDF info container
    const pdfInfoContainer = document.createElement('div');
    pdfInfoContainer.className = 'pdf-info';
    
    // Create PDF icon
    const pdfIcon = document.createElement('div');
    pdfIcon.className = 'pdf-icon';
    pdfIcon.innerHTML = '<i class="material-icons">picture_as_pdf</i>';
    
    // Create PDF details
    const pdfDetails = document.createElement('div');
    pdfDetails.className = 'pdf-details';
    
    // File name
    const fileName = document.createElement('h3');
    fileName.textContent = file.name;
    
    // File info
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';
    
    // Number of pages
    const pagesInfo = document.createElement('span');
    pagesInfo.innerHTML = `<i class="material-icons">filter_none</i> ${pdfDoc.numPages} Pages`;
    
    // File size
    const sizeInfo = document.createElement('span');
    sizeInfo.innerHTML = `<i class="material-icons">sd_storage</i> ${formatFileSize(file.size)}`;
    
    fileInfo.appendChild(pagesInfo);
    fileInfo.appendChild(sizeInfo);
    
    pdfDetails.appendChild(fileName);
    pdfDetails.appendChild(fileInfo);
    
    pdfInfoContainer.appendChild(pdfIcon);
    pdfInfoContainer.appendChild(pdfDetails);
    
    pdfPreview.appendChild(pdfInfoContainer);
    
    // Create thumbnails container
    const thumbnailsContainer = document.createElement('div');
    thumbnailsContainer.className = 'pdf-thumbnails';
    
    // Create thumbnails heading
    const thumbnailsHeading = document.createElement('h4');
    thumbnailsHeading.textContent = 'Preview Pages';
    thumbnailsContainer.appendChild(thumbnailsHeading);
    
    // Create thumbnails grid
    const thumbnailsGrid = document.createElement('div');
    thumbnailsGrid.className = 'thumbnails-grid';
    
    // Generate thumbnails for the first few pages (up to 6)
    const pagesToShow = Math.min(pdfDoc.numPages, 6);
    
    for (let i = 1; i <= pagesToShow; i++) {
        pdfDoc.getPage(i).then(page => {
            createPageThumbnail(page, i).then(thumbnail => {
                thumbnailsGrid.appendChild(thumbnail);
            });
        });
    }
    
    thumbnailsContainer.appendChild(thumbnailsGrid);
    pdfPreview.appendChild(thumbnailsContainer);
}

// Create thumbnail for a PDF page
async function createPageThumbnail(page, pageNumber) {
    const scale = 0.2;
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;
    
    const thumbnail = document.createElement('div');
    thumbnail.className = 'page-thumbnail';
    
    const pageImg = document.createElement('img');
    pageImg.src = canvas.toDataURL('image/jpeg');
    
    const pageLabel = document.createElement('span');
    pageLabel.className = 'page-number';
    pageLabel.textContent = `Page ${pageNumber}`;
    
    thumbnail.appendChild(pageImg);
    thumbnail.appendChild(pageLabel);
    
    return thumbnail;
}

// Format file size for display
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
}

// Convert PDF to images
async function convertPdfToImages() {
    if (!pdfDocument || isConverting) return;
    
    try {
        isConverting = true;
        convertedImages = [];
        
        // Show converting status
        showConvertingStatus();
        
        // Get conversion options
        const format = 'jpg'; // Default format is JPG
        const quality = 0.92; // Default quality (92% for JPG)
        const dpi = 300; // Default DPI
        
        // Scale factor based on DPI (72 DPI is the default for PDF)
        const scale = dpi / 72;
        
        // Start conversion
        updateConvertingStatus('Preparing to convert...', 0);
        await sleep(500); // Short delay for UI update
        
        // Use the full page range
        let startPage = 1;
        let endPage = pdfPages;
        
        // Total pages to process
        const totalPages = endPage - startPage + 1;
        
        // Process each page
        for (let i = startPage; i <= endPage; i++) {
            // Update status
            updateConvertingStatus(`Converting page ${i} of ${endPage}...`, ((i - startPage) / totalPages) * 100);
            
            // Get the page
            const page = await pdfDocument.getPage(i);
            
            // Render page to image
            const imageData = await renderPageToImage(page, scale, format, quality);
            
            // Add to converted images
            convertedImages.push({
                pageNumber: i,
                data: imageData,
                format: format
            });
            
            // Small delay to prevent UI freezing
            await sleep(10);
        }
        
        // Update status
        updateConvertingStatus('Finalizing conversion...', 100);
        await sleep(500); // Short delay for UI update
        
        // Hide converting status
        hideConvertingStatus();
        
        // Show results
        displayResults();
        
        // Show toast
        showToast(`Successfully converted ${convertedImages.length} pages to images`, 'success');
        
        // Show download options
        downloadOptions.style.display = 'block';
    } catch (error) {
        console.error('Error converting PDF to images:', error);
        hideConvertingStatus();
        showToast('Error converting PDF: ' + error.message, 'error');
    } finally {
        isConverting = false;
    }
}

// Sleep function for delays
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Render a PDF page to an image
async function renderPageToImage(page, scale, format, quality) {
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;
    
    // Convert canvas to image data
    let imageData;
    if (format === 'jpg' || format === 'jpeg') {
        imageData = canvas.toDataURL('image/jpeg', quality);
    } else {
        imageData = canvas.toDataURL('image/png');
    }
    
    return imageData;
}

// Show converting status overlay
function showConvertingStatus() {
    // Create overlay if it doesn't exist
    let overlay = document.getElementById('convertingOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'convertingOverlay';
        overlay.className = 'converting-overlay';
        
        const content = document.createElement('div');
        content.className = 'converting-content';
        
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        
        const status = document.createElement('div');
        status.className = 'converting-status';
        status.id = 'convertingStatus';
        status.textContent = 'Converting...';
        
        const progress = document.createElement('div');
        progress.className = 'progress-bar-container';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.id = 'convertingProgress';
        
        progress.appendChild(progressBar);
        
        content.appendChild(spinner);
        content.appendChild(status);
        content.appendChild(progress);
        
        overlay.appendChild(content);
        document.body.appendChild(overlay);
    }
    
    // Show overlay
    overlay.style.display = 'flex';
}

// Update converting status text and progress
function updateConvertingStatus(text, percentage) {
    const status = document.getElementById('convertingStatus');
    const progress = document.getElementById('convertingProgress');
    
    if (status && progress) {
        status.textContent = text;
        progress.style.width = `${percentage}%`;
        
        // Change color based on progress
        if (percentage < 30) {
            progress.style.backgroundColor = '#f44336';
        } else if (percentage < 70) {
            progress.style.backgroundColor = '#ff9800';
        } else {
            progress.style.backgroundColor = '#4caf50';
        }
    }
}

// Hide converting status overlay
function hideConvertingStatus() {
    const overlay = document.getElementById('convertingOverlay');
    if (overlay) {
        // Add fade-out class
        overlay.classList.add('fade-out');
        
        // Remove after animation
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
}

// Display converted images
function displayResults() {
    // Clear previous results
    resultArea.innerHTML = '';
    
    // Create results container
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'results-container';
    
    // Create heading
    const heading = document.createElement('h3');
    heading.innerHTML = '<i class="material-icons">image</i> Converted Images';
    resultsContainer.appendChild(heading);
    
    // Create images grid
    const imagesGrid = document.createElement('div');
    imagesGrid.className = 'images-grid';
    
    // Add each converted image
    convertedImages.forEach(image => {
        // Create image item
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        
        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';
        
        // Create image element
        const img = document.createElement('img');
        img.src = image.data;
        img.alt = `Page ${image.pageNumber}`;
        img.addEventListener('click', () => previewImage(image));
        
        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'image-download-btn';
        downloadBtn.innerHTML = '<i class="material-icons">file_download</i>';
        downloadBtn.title = 'Download this image';
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            downloadSingleImage(image);
        });
        
        // Create image info
        const imageInfo = document.createElement('div');
        imageInfo.className = 'image-info';
        imageInfo.textContent = `Page ${image.pageNumber}`;
        
        // Assemble image item
        imageContainer.appendChild(img);
        imageContainer.appendChild(downloadBtn);
        imageItem.appendChild(imageContainer);
        imageItem.appendChild(imageInfo);
        
        // Add to grid
        imagesGrid.appendChild(imageItem);
    });
    
    resultsContainer.appendChild(imagesGrid);
    resultArea.appendChild(resultsContainer);
    
    // Show result area
    resultArea.style.display = 'block';
}

// Preview image in full size
function previewImage(image) {
    // Create preview overlay
    const overlay = document.createElement('div');
    overlay.className = 'preview-overlay';
    
    // Create preview container
    const container = document.createElement('div');
    container.className = 'preview-container';
    
    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'preview-image-container';
    
    // Create image
    const img = document.createElement('img');
    img.src = image.data;
    img.alt = `Page ${image.pageNumber}`;
    img.className = 'preview-image';
    
    // Create toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'preview-toolbar';
    
    // Page info
    const pageInfo = document.createElement('div');
    pageInfo.className = 'preview-page-info';
    pageInfo.textContent = `Page ${image.pageNumber} of ${convertedImages.length}`;
    
    // Download button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'preview-download-btn';
    downloadBtn.innerHTML = '<i class="material-icons">file_download</i> Download';
    downloadBtn.addEventListener('click', () => downloadSingleImage(image));
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'preview-close-btn';
    closeBtn.innerHTML = '<i class="material-icons">close</i>';
    closeBtn.addEventListener('click', closePreview);
    
    // Navigation buttons (if multiple pages)
    if (convertedImages.length > 1) {
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'preview-nav-btn prev';
        prevBtn.innerHTML = '<i class="material-icons">chevron_left</i>';
        prevBtn.title = 'Previous page';
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'preview-nav-btn next';
        nextBtn.innerHTML = '<i class="material-icons">chevron_right</i>';
        nextBtn.title = 'Next page';
        
        // Add navigation functionality
        prevBtn.addEventListener('click', () => {
            const currentIndex = convertedImages.findIndex(img => img.pageNumber === image.pageNumber);
            if (currentIndex > 0) {
                // Update image and page info
                img.src = convertedImages[currentIndex - 1].data;
                pageInfo.textContent = `Page ${convertedImages[currentIndex - 1].pageNumber} of ${convertedImages.length}`;
                // Update current image for download button
                downloadBtn.onclick = () => downloadSingleImage(convertedImages[currentIndex - 1]);
            }
        });
        
        nextBtn.addEventListener('click', () => {
            const currentIndex = convertedImages.findIndex(img => img.pageNumber === image.pageNumber);
            if (currentIndex < convertedImages.length - 1) {
                // Update image and page info
                img.src = convertedImages[currentIndex + 1].data;
                pageInfo.textContent = `Page ${convertedImages[currentIndex + 1].pageNumber} of ${convertedImages.length}`;
                // Update current image for download button
                downloadBtn.onclick = () => downloadSingleImage(convertedImages[currentIndex + 1]);
            }
        });
        
        toolbar.appendChild(prevBtn);
        toolbar.appendChild(pageInfo);
        toolbar.appendChild(nextBtn);
    } else {
        toolbar.appendChild(pageInfo);
    }
    
    // Add buttons to toolbar
    toolbar.appendChild(downloadBtn);
    toolbar.appendChild(closeBtn);
    
    // Assemble preview
    imageContainer.appendChild(img);
    container.appendChild(imageContainer);
    container.appendChild(toolbar);
    overlay.appendChild(container);
    
    // Add to body
    document.body.appendChild(overlay);
    
    // Enable close on background click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closePreview();
        }
    });
    
    // Enable close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePreview();
        }
    }, { once: true });
    
    // Prevent body scrolling
    document.body.classList.add('no-scroll');
}

// Close image preview
function closePreview() {
    const overlay = document.querySelector('.preview-overlay');
    if (overlay) {
        // Add fade-out animation
        overlay.classList.add('fade-out');
        
        // Remove after animation
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            // Restore body scrolling
            document.body.classList.remove('no-scroll');
        }, 300);
    }
}

// Download a single image
function downloadSingleImage(image) {
    const fileName = getFileName(currentPdfFile.name, image.pageNumber, image.format);
    
    const link = document.createElement('a');
    link.href = image.data;
    link.download = fileName;
    link.click();
    
    showToast(`Downloading ${fileName}`, 'success');
}

// Download all images as a ZIP file
async function downloadAllImages() {
    if (convertedImages.length === 0) return;
    
    try {
        // Check if JSZip is loaded
        if (typeof JSZip === 'undefined') {
            await loadJSZip();
        }
        
        // Show loading toast
        showToast('Preparing ZIP file...', 'info');
        
        // Create new ZIP
        const zip = new JSZip();
        
        // Add each image to ZIP
        convertedImages.forEach(image => {
            const fileName = getFileName(currentPdfFile.name, image.pageNumber, image.format);
            
            // Convert data URL to blob
            const dataUrl = image.data;
            const binary = atob(dataUrl.split(',')[1]);
            const array = [];
            for (let i = 0; i < binary.length; i++) {
                array.push(binary.charCodeAt(i));
            }
            const blob = new Blob([new Uint8Array(array)], { type: 'image/' + image.format });
            
            // Add to ZIP
            zip.file(fileName, blob);
        });
        
        // Generate ZIP file
        const zipContent = await zip.generateAsync({ type: 'blob' });
        
        // Download ZIP
        const zipFileName = getZipFileName(currentPdfFile.name);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipContent);
        link.download = zipFileName;
        link.click();
        
        showToast(`Downloading ${zipFileName}`, 'success');
    } catch (error) {
        console.error('Error creating ZIP file:', error);
        showToast('Error creating ZIP file: ' + error.message, 'error');
    }
}

// Load JSZip dynamically if not available
function loadJSZip() {
    return new Promise((resolve, reject) => {
        if (typeof JSZip !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load JSZip library'));
        document.head.appendChild(script);
    });
}

// Get file name for a single image
function getFileName(baseName, pageNumber, format) {
    const baseNameWithoutExtension = baseName.replace(/\.[^/.]+$/, "");
    return `${baseNameWithoutExtension}_page${pageNumber}.${format}`;
}

// Get file name for ZIP archive
function getZipFileName(baseName) {
    const baseNameWithoutExtension = baseName.replace(/\.[^/.]+$/, "");
    return `${baseNameWithoutExtension}_images.zip`;
}

// Clear all data and reset UI
function clearAll() {
    // Reset file input
    fileInput.value = '';
    
    // Clear PDF preview
    pdfPreview.innerHTML = '';
    
    // Hide conversion options
    conversionOptions.style.display = 'none';
    
    // Disable buttons
    convertBtn.disabled = true;
    clearBtn.disabled = true;
    
    // Hide result area
    resultArea.style.display = 'none';
    
    // Hide download options
    downloadOptions.style.display = 'none';
    
    // Reset variables
    currentPdfFile = null;
    pdfDocument = null;
    pdfPages = 0;
    convertedImages = [];
    
    // Remove any overlays
    const overlay = document.getElementById('convertingOverlay');
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
    
    // Show upload area
    uploadArea.style.display = 'flex';
    
    // Show toast
    showToast('All cleared', 'info');
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Set icon based on type
    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    else if (type === 'warning') icon = 'warning';
    else if (type === 'error') icon = 'error';
    
    // Create toast content
    toast.innerHTML = `
        <i class="material-icons">${icon}</i>
        <span>${message}</span>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Auto remove after timeout
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toastContainer.removeChild(toast);
            }
        }, 300);
    }, 3000);
} 