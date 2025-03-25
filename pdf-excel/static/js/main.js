// Execute when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('pdfFile');
    const selectButton = document.getElementById('selectButton');
    const statusSection = document.getElementById('statusSection');
    const downloadSection = document.getElementById('downloadSection');
    const progressBar = document.getElementById('progressBar');
    const statusText = document.getElementById('statusText');
    const downloadBtn = document.getElementById('downloadBtn');
    const errorMessage = document.getElementById('errorMessage');
    const uploadCard = document.querySelector('.upload-card');
    
    // Add click event for file selection button
    if (selectButton && fileInput) {
        selectButton.addEventListener('click', function() {
            fileInput.click();
        });
    }
    
    // Automatically upload when file is selected
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                
                // Check if file is PDF
                if (file.type !== 'application/pdf') {
                    showError('Please upload a PDF file');
                    return;
                }
                
                // Show status section
                statusSection.classList.add('show');
                if (uploadCard) {
                    uploadCard.classList.add('with-status');
                }
                downloadSection.classList.remove('show');
                errorMessage.classList.remove('show');
                
                // Update status text
                statusText.textContent = 'Uploading...';
                progressBar.style.width = '10%';
                
                // Create FormData object
                const formData = new FormData();
                formData.append('pdf', file);
                
                // Create XHR object
                const xhr = new XMLHttpRequest();
                
                // Monitor upload progress
                xhr.upload.addEventListener('progress', function(e) {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        const progressWidth = 10 + (percentComplete * 0.5); // Upload takes 50% of progress
                        progressBar.style.width = `${progressWidth}%`;
                        
                        if (percentComplete >= 90) {
                            statusText.textContent = 'Processing PDF...';
                        }
                    }
                });
                
                // Handle response
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            try {
                                const data = JSON.parse(xhr.responseText);
                                if (data.status === 'success') {
                                    // Show download button
                                    downloadSection.classList.add('show');
                                    downloadBtn.href = data.download_url;
                                    
                                    // Hide status section
                                    statusSection.classList.remove('show');
                                    // Keep upload card's special style to connect with download area
                                    // Don't remove with-status class
                                    // if (uploadCard) {
                                    //     uploadCard.classList.remove('with-status');
                                    // }
                                    
                                    // Reset progress bar
                                    progressBar.style.width = '0%';
                                    
                                    // Reset file input to allow selecting the same file again
                                    fileInput.value = '';
                                } else {
                                    showError(data.message || 'Processing failed, please try again');
                                }
                            } catch (error) {
                                showError('Server response format error');
                            }
                        } else {
                            showError('Upload failed, please try again');
                        }
                    }
                };
                
                // Set timer to simulate conversion progress
                let processingProgress = 50;
                const processingInterval = setInterval(function() {
                    if (processingProgress < 95) {
                        processingProgress += 5;
                        const totalProgress = 10 + (processingProgress * 0.9);
                        progressBar.style.width = `${totalProgress}%`;
                        
                        // Update status text
                        if (processingProgress < 70) {
                            statusText.textContent = 'Processing PDF...';
                        } else if (processingProgress < 90) {
                            statusText.textContent = 'Recognizing tables...';
                        } else {
                            statusText.textContent = 'Generating Excel...';
                        }
                    } else {
                        clearInterval(processingInterval);
                    }
                }, 500);
                
                // Send request
                xhr.open('POST', '/upload', true);
                xhr.send(formData);
                
                // Clear progress simulation when request completes
                xhr.onload = function() {
                    clearInterval(processingInterval);
                    if (xhr.status !== 200) {
                        showError('Error processing file');
                    }
                };
                
                xhr.onerror = function() {
                    clearInterval(processingInterval);
                    showError('Network error, please try again');
                };
            }
        });
    }
    
    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        statusSection.classList.remove('show');
        downloadSection.classList.remove('show');
        if (uploadCard) {
            uploadCard.classList.remove('with-status');
        }
        
        // Reset file input to allow selecting the same file again
        if (fileInput) {
            fileInput.value = '';
        }
    }
});