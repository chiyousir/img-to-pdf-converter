document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const imageList = document.getElementById('imageList');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    
    // Ensure buttons are correctly found
    console.log('Button status at initialization:', { 
        convertBtn: convertBtn ? convertBtn.disabled : 'not found',
        clearBtn: clearBtn ? clearBtn.disabled : 'not found',
        selectAllBtn: selectAllBtn ? selectAllBtn.disabled : 'not found',
        deleteSelectedBtn: deleteSelectedBtn ? deleteSelectedBtn.disabled : 'not found'
    });
    
    // Initially hide select all and delete selected buttons
    selectAllBtn.classList.add('hidden');
    deleteSelectedBtn.classList.add('hidden');
    
    // Store uploaded images and deleted images
    const uploadedImages = [];
    const deletedImages = new Map(); // Use Map to store deleted images, key is image hash, value is {file, timestamp}
    let isSelectAll = false;
    
    // Create toast element
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);

    // Function to show toast message
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Set icon color
        let iconColor = '#e53935'; // Default use main red color
        if (type === 'success') {
            iconColor = '#4caf50'; // Success message uses green
        } else if (type === 'warning') {
            iconColor = '#ff9800'; // Warning message uses orange
        } else if (type === 'error') {
            iconColor = '#f44336'; // Error message uses red
        }
        
        // Set icon
        let icon = 'info';
        if (type === 'success') {
            icon = 'check_circle';
        } else if (type === 'warning') {
            icon = 'warning';
        } else if (type === 'error') {
            icon = 'error';
        }
        
        toast.innerHTML = `
            <i class="material-icons" style="color: ${iconColor}">${icon}</i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Automatically remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    // Initialize Sortable for image list
    if (typeof Sortable !== 'undefined') {
        new Sortable(imageList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function() {
                // Update array order after drag
                const imageItems = Array.from(imageList.querySelectorAll('.image-item'));
                const newOrder = [];
                
                imageItems.forEach(item => {
                    const index = parseInt(item.dataset.index);
                    newOrder.push(uploadedImages[index]);
                });
                
                // Reassign with new order
                uploadedImages.length = 0;
                uploadedImages.push(...newOrder);
                
                // Update index attribute
                imageItems.forEach((item, i) => {
                    item.dataset.index = i;
                });
            }
        });
    } else {
        console.error('Sortable library not loaded');
        showToast('Unable to load sorting functionality', 'error');
    }
    
    // Function to get file hash for duplicate detection
    function getFileHash(file) {
        // Simple hash using file name, size and last modified time
        return `${file.name}-${file.size}-${file.lastModified}`;
    }
    
    // Check if image is in deleted map
    function isDeletedImage(file) {
        const hash = getFileHash(file);
        return deletedImages.has(hash);
    }
    
    // Create recover button for recently deleted images
    function createRecoverButton(file) {
        const hash = getFileHash(file);
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'recover-container';
        
        const recoverBtn = document.createElement('button');
        recoverBtn.className = 'recover-btn';
        recoverBtn.innerHTML = '<i class="material-icons">restore</i> Recover';
        
        recoverBtn.addEventListener('click', function() {
            deletedImages.delete(hash);
            addImageToList(file);
            buttonContainer.remove();
            showToast('Image recovered successfully', 'success');
        });
        
        const countdown = document.createElement('div');
        countdown.className = 'recover-countdown';
        
        buttonContainer.appendChild(recoverBtn);
        buttonContainer.appendChild(countdown);
        
        // Start 10 second countdown
        let timeLeft = 10;
        countdown.textContent = `${timeLeft}s`;
        
        const timer = setInterval(() => {
            timeLeft--;
            countdown.textContent = `${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                buttonContainer.remove();
            }
        }, 1000);
        
        return buttonContainer;
    }
    
    // Prevent default drag and drop behaviors
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Add event listeners for drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Highlight drop area
    function highlight() {
        uploadArea.classList.add('highlight');
    }
    
    // Remove highlight from drop area
    function unhighlight() {
        uploadArea.classList.remove('highlight');
    }
    
    // Handle drop event
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFiles(files);
        }
    }
    
    uploadArea.addEventListener('drop', handleDrop, false);
    
    // Handle files from input or drop
    function handleFiles(files) {
        files = Array.from(files);
        
        // Filter only image files
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            showToast('Please select image files only', 'error');
            return;
        }
        
        if (imageFiles.length !== files.length) {
            showToast(`${files.length - imageFiles.length} non-image files were ignored`, 'warning');
        }
        
        // Check if any files are already uploaded
        const duplicates = imageFiles.filter(file => 
            uploadedImages.some(img => getFileHash(img) === getFileHash(file)) ||
            isDeletedImage(file)
        );
        
        if (duplicates.length > 0) {
            showToast(`${duplicates.length} duplicate images were ignored`, 'warning');
        }
        
        // Filter out duplicates
        const newFiles = imageFiles.filter(file => 
            !uploadedImages.some(img => getFileHash(img) === getFileHash(file)) &&
            !isDeletedImage(file)
        );
        
        // Add new files to list
        newFiles.forEach(file => {
            addImageToList(file);
        });
        
        // Show success message
        if (newFiles.length > 0) {
            showToast(`${newFiles.length} images uploaded successfully`, 'success');
            
            // Update button states
            updateButtonState();
        }
    }
    
    // Add image to the list
    function addImageToList(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            
            img.onload = function() {
                const index = uploadedImages.length;
                uploadedImages.push(file);
                
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                imageItem.dataset.index = index;
                
                // Create image container
                const imageContainer = document.createElement('div');
                imageContainer.className = 'image-container';
                
                // Create image element with preview
                const imagePreview = document.createElement('img');
                imagePreview.src = e.target.result;
                imagePreview.alt = file.name;
                imagePreview.className = 'image-preview';
                
                // Make image preview clickable to show full size
                imagePreview.addEventListener('click', function() {
                    previewImage(this);
                });
                
                // Add checkbox for selection
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'image-checkbox';
                checkbox.addEventListener('change', function() {
                    // Update selected state visual
                    imageItem.classList.toggle('selected', this.checked);
                    
                    // Update delete button state
                    updateDeleteButtonState();
                });
                
                // Create image info section
                const imageInfo = document.createElement('div');
                imageInfo.className = 'image-info';
                
                // Show image name (truncated if too long)
                const fileName = file.name.length > 20 
                    ? file.name.substring(0, 17) + '...' 
                    : file.name;
                
                // Show image dimensions
                const imageDimensions = document.createElement('span');
                imageDimensions.className = 'image-dimensions';
                imageDimensions.textContent = `${img.width} × ${img.height}`;
                
                // Create image controls
                const imageControls = document.createElement('div');
                imageControls.className = 'image-controls';
                
                // Rotation controls
                const rotateLeft = document.createElement('button');
                rotateLeft.className = 'rotate-btn';
                rotateLeft.innerHTML = '<i class="material-icons">rotate_left</i>';
                rotateLeft.title = 'Rotate left';
                rotateLeft.addEventListener('click', function() {
                    rotateImage(index, -90);
                });
                
                const rotateRight = document.createElement('button');
                rotateRight.className = 'rotate-btn';
                rotateRight.innerHTML = '<i class="material-icons">rotate_right</i>';
                rotateRight.title = 'Rotate right';
                rotateRight.addEventListener('click', function() {
                    rotateImage(index, 90);
                });
                
                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '<i class="material-icons">delete</i>';
                deleteBtn.title = 'Delete';
                deleteBtn.addEventListener('click', function() {
                    removeImage(imageItem, file);
                });
                
                // Assemble the controls
                imageControls.appendChild(rotateLeft);
                imageControls.appendChild(rotateRight);
                imageControls.appendChild(deleteBtn);
                
                // Assemble the file name and dimensions
                const fileNameElement = document.createElement('span');
                fileNameElement.className = 'image-name';
                fileNameElement.textContent = fileName;
                fileNameElement.title = file.name; // Full name on hover
                
                imageInfo.appendChild(fileNameElement);
                imageInfo.appendChild(imageDimensions);
                
                // Assemble the image container
                imageContainer.appendChild(imagePreview);
                imageContainer.appendChild(checkbox);
                
                // Assemble the entire image item
                imageItem.appendChild(imageContainer);
                imageItem.appendChild(imageInfo);
                imageItem.appendChild(imageControls);
                
                // Add to UI
                imageList.appendChild(imageItem);
                
                // Show select all button if we have images
                selectAllBtn.classList.remove('hidden');
                
                // Update rotation state tracking
                imageItem.dataset.rotation = '0';
            };
        };
        
        reader.readAsDataURL(file);
    }
    
    // Function to rotate image
    function rotateImage(index, degrees) {
        // Get image element
        const imageItem = document.querySelector(`.image-item[data-index="${index}"]`);
        const imagePreview = imageItem.querySelector('.image-preview');
        
        // Calculate new rotation value
        const currentRotation = parseInt(imageItem.dataset.rotation || '0');
        const newRotation = (currentRotation + degrees) % 360;
        
        // Update data attribute
        imageItem.dataset.rotation = newRotation;
        
        // Apply rotation with CSS transform
        imagePreview.style.transform = `rotate(${newRotation}deg)`;
        
        // If rotation is 90 or 270 degrees, swap width/height constraints
        if (newRotation % 180 !== 0) {
            imagePreview.classList.add('rotated');
        } else {
            imagePreview.classList.remove('rotated');
        }
    }
    
    // Update button states based on uploaded images
    function updateButtonState() {
        if (uploadedImages.length > 0) {
            convertBtn.disabled = false;
            clearBtn.disabled = false;
            selectAllBtn.classList.remove('hidden');
            
            // Check if any images are selected
            const hasSelectedImages = Array.from(
                document.querySelectorAll('.image-checkbox')
            ).some(checkbox => checkbox.checked);
            
            if (hasSelectedImages) {
                deleteSelectedBtn.classList.remove('hidden');
            } else {
                deleteSelectedBtn.classList.add('hidden');
            }
        } else {
            convertBtn.disabled = true;
            clearBtn.disabled = true;
            selectAllBtn.classList.add('hidden');
            deleteSelectedBtn.classList.add('hidden');
        }
    }
    
    // File input change handler
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFiles(this.files);
            this.value = ''; // Reset input to allow selecting the same files again
        }
    });
    
    // Click handler for the upload area
    uploadArea.addEventListener('click', function(e) {
        // Prevent click from triggering if user is interacting with a child element
        if (e.target === uploadArea || e.target.closest('.upload-btn') || e.target.closest('.upload-icon') || e.target === uploadArea.querySelector('p')) {
            fileInput.click();
        }
    });
    
    // Generate PDF
    function generatePDF() {
        // Get selected images or all if none selected
        const checkboxes = Array.from(document.querySelectorAll('.image-checkbox'));
        const selectedIndices = checkboxes
            .filter(checkbox => checkbox.checked)
            .map(checkbox => parseInt(checkbox.closest('.image-item').dataset.index));
        
        // Use selected images or all if none selected
        const imagesToProcess = selectedIndices.length > 0 
            ? selectedIndices.map(index => ({
                file: uploadedImages[index],
                rotation: parseInt(document.querySelector(`.image-item[data-index="${index}"]`).dataset.rotation || '0')
            }))
            : uploadedImages.map((file, index) => ({
                file,
                rotation: parseInt(document.querySelector(`.image-item[data-index="${index}"]`).dataset.rotation || '0')
            }));
        
        if (imagesToProcess.length === 0) {
            showToast('No images to convert', 'error');
            return;
        }
        
        // Show loading state
        const loadingToast = document.createElement('div');
        loadingToast.className = 'toast loading';
        loadingToast.innerHTML = `
            <div class="loading-spinner"></div>
            <span>Processing images... </span>
            <span class="progress-text">0/${imagesToProcess.length}</span>
        `;
        toastContainer.appendChild(loadingToast);
        
        // Get document
        if (typeof jspdf !== 'undefined' || window.jspdf) {
            const { jsPDF } = window.jspdf || window.jspdf;
            
            // Check if jsPDF is available
            if (typeof jsPDF === 'function') {
                try {
                    // Create PDF document
                    const doc = new jsPDF();
                    let currentPage = 1;
                    const progressText = loadingToast.querySelector('.progress-text');
                    
                    // Process images sequentially
                    const processImages = async () => {
                        for (let i = 0; i < imagesToProcess.length; i++) {
                            // Update progress
                            progressText.textContent = `${i+1}/${imagesToProcess.length}`;
                            
                            // Get current image data
                            const { file, rotation } = imagesToProcess[i];
                            
                            // Create a promise to load the image
                            const imageDataPromise = new Promise((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onload = function(e) {
                                    const img = new Image();
                                    img.onload = function() {
                                        resolve({ img, result: e.target.result });
                                    };
                                    img.onerror = reject;
                                    img.src = e.target.result;
                                };
                                reader.onerror = reject;
                                reader.readAsDataURL(file);
                            });
                            
                            try {
                                // Wait for image to load
                                const { img, result } = await imageDataPromise;
                                
                                // Get dimensions
                                let imgWidth = img.width;
                                let imgHeight = img.height;
                                
                                // If rotated by 90 or 270 degrees, swap dimensions
                                if (rotation % 180 !== 0) {
                                    [imgWidth, imgHeight] = [imgHeight, imgWidth];
                                }
                                
                                // Calculate page size to fit the image
                                const pageWidth = doc.internal.pageSize.getWidth();
                                const pageHeight = doc.internal.pageSize.getHeight();
                                
                                // Scale image to fit page while maintaining aspect ratio
                                let finalWidth = imgWidth;
                                let finalHeight = imgHeight;
                                
                                const ratio = imgWidth / imgHeight;
                                
                                if (finalWidth > pageWidth) {
                                    finalWidth = pageWidth - 20; // 10px margin on each side
                                    finalHeight = finalWidth / ratio;
                                }
                                
                                if (finalHeight > pageHeight) {
                                    finalHeight = pageHeight - 20; // 10px margin on top/bottom
                                    finalWidth = finalHeight * ratio;
                                }
                                
                                // Center image on page
                                const xOffset = (pageWidth - finalWidth) / 2;
                                const yOffset = (pageHeight - finalHeight) / 2;
                                
                                // Add new page for each image after the first one
                                if (i > 0) {
                                    doc.addPage();
                                    currentPage++;
                                }
                                
                                // Add image to PDF
                                if (rotation !== 0) {
                                    // For rotated images, we need to use a canvas
                                    const canvas = document.createElement('canvas');
                                    const ctx = canvas.getContext('2d');
                                    
                                    // Adjust canvas size based on rotation
                                    if (rotation % 180 !== 0) {
                                        canvas.width = img.height;
                                        canvas.height = img.width;
                                    } else {
                                        canvas.width = img.width;
                                        canvas.height = img.height;
                                    }
                                    
                                    // Move to center of canvas
                                    ctx.translate(canvas.width / 2, canvas.height / 2);
                                    
                                    // Rotate context
                                    ctx.rotate(rotation * Math.PI / 180);
                                    
                                    // Draw image centered
                                    ctx.drawImage(img, -img.width / 2, -img.height / 2);
                                    
                                    // Get data URL from canvas
                                    const rotatedImgData = canvas.toDataURL('image/jpeg');
                                    
                                    // Add to PDF
                                    doc.addImage(rotatedImgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
                                } else {
                                    // No rotation, add image directly
                                    doc.addImage(result, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
                                }
                            } catch (err) {
                                console.error('Error processing image:', err);
                                showToast(`Error processing image ${file.name}`, 'error');
                            }
                        }
                        
                        // Save the PDF
                        const fileName = imagesToProcess.length === 1 
                            ? `${imagesToProcess[0].file.name.split('.')[0]}.pdf`
                            : `vvchange_images_${new Date().toISOString().slice(0, 10)}.pdf`;
                        
                        doc.save(fileName);
                        
                        // Remove loading toast
                        toastContainer.removeChild(loadingToast);
                        
                        // Show success message
                        showToast(`PDF created with ${imagesToProcess.length} images`, 'success');
                        
                        // Uncheck all checkboxes after conversion
                        const checkboxes = document.querySelectorAll('.image-checkbox');
                        checkboxes.forEach(checkbox => {
                            checkbox.checked = false;
                        });
                        
                        // Update UI state
                        isSelectAll = false;
                        selectAllBtn.textContent = 'Select All';
                        
                        // Remove selected class from all items
                        document.querySelectorAll('.image-item').forEach(item => {
                            item.classList.remove('selected');
                        });
                        
                        // Update button states
                        updateButtonState();
                    };
                    
                    // Start processing images
                    processImages();
                    
                } catch (err) {
                    console.error('Error creating PDF:', err);
                    toastContainer.removeChild(loadingToast);
                    showToast('Error creating PDF. Please try again.', 'error');
                }
            } else {
                showToast('PDF generation library not loaded properly. Please refresh the page.', 'error');
            }
        } else {
            showToast('PDF generation library not loaded. Please refresh the page.', 'error');
        }
    }
    
    // Update delete button state
    function updateDeleteButtonState() {
        const hasSelectedImages = Array.from(
            document.querySelectorAll('.image-checkbox')
        ).some(checkbox => checkbox.checked);
        
        if (hasSelectedImages) {
            deleteSelectedBtn.classList.remove('hidden');
        } else {
            deleteSelectedBtn.classList.add('hidden');
        }
    }
    
    // Clear all images
    clearBtn.addEventListener('click', function() {
        // Clear all images
        imageList.innerHTML = '';
        uploadedImages.length = 0;
        
        // Reset button states
        updateButtonState();
        
        showToast('All images cleared', 'info');
    });
    
    // Select all images
    selectAllBtn.addEventListener('click', function() {
        isSelectAll = !isSelectAll;
        
        const checkboxes = document.querySelectorAll('.image-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = isSelectAll;
            checkbox.closest('.image-item').classList.toggle('selected', isSelectAll);
        });
        
        // Update button text
        this.innerHTML = isSelectAll 
            ? '<i class="material-icons">deselect</i> Deselect All'
            : '<i class="material-icons">select_all</i> Select All';
        
        updateDeleteButtonState();
    });
    
    // Preview image in large view
    function previewImage(image) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'preview-overlay';
        
        // Create image container
        const container = document.createElement('div');
        container.className = 'preview-container';
        
        // Create image element
        const previewImg = document.createElement('img');
        previewImg.src = image.src;
        previewImg.className = 'preview-image';
        
        // Get rotation from original image
        const imageItem = image.closest('.image-item');
        const rotation = imageItem ? parseInt(imageItem.dataset.rotation || '0') : 0;
        
        // Apply rotation to preview
        previewImg.style.transform = `rotate(${rotation}deg)`;
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'preview-close';
        closeBtn.innerHTML = '<i class="material-icons">close</i>';
        
        // Handle close
        function closePreview() {
            document.body.removeChild(overlay);
            document.body.classList.remove('no-scroll');
        }
        
        closeBtn.addEventListener('click', closePreview);
        
        // Close on overlay click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closePreview();
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closePreview();
            }
        }, { once: true });
        
        // Prevent body scrolling
        document.body.classList.add('no-scroll');
        
        // Assemble preview
        container.appendChild(previewImg);
        overlay.appendChild(closeBtn);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
    }
    
    // Delete selected images
    deleteSelectedBtn.addEventListener('click', function() {
        const selectedItems = Array.from(
            document.querySelectorAll('.image-item')
        ).filter(item => 
            item.querySelector('.image-checkbox').checked
        );
        
        if (selectedItems.length === 0) {
            showToast('No images selected', 'warning');
            return;
        }
        
        // Remove each selected image
        selectedItems.forEach(item => {
            const index = parseInt(item.dataset.index);
            const file = uploadedImages[index];
            removeImage(item, file);
        });
        
        // Reset select all state
        isSelectAll = false;
        selectAllBtn.innerHTML = '<i class="material-icons">select_all</i> Select All';
        
        showToast(`${selectedItems.length} images deleted`, 'success');
        
        // Hide delete button
        deleteSelectedBtn.classList.add('hidden');
    });
    
    // Remove image function
    function removeImage(imageItem, file) {
        const index = parseInt(imageItem.dataset.index);
        
        // Add to deleted images map
        const hash = getFileHash(file);
        deletedImages.set(hash, {
            file: file,
            timestamp: Date.now()
        });
        
        // Remove from array
        uploadedImages.splice(index, 1);
        
        // Remove from DOM
        imageItem.remove();
        
        // Create recover button
        const recoverButton = createRecoverButton(file);
        imageList.appendChild(recoverButton);
        
        // Update indices of remaining items
        document.querySelectorAll('.image-item').forEach((item, i) => {
            item.dataset.index = i;
        });
        
        // Update button states
        updateButtonState();
        
        // Show toast
        showToast('Image removed. Click Recover to undo.', 'info');
    }
    
    // Generate PDF button click handler
    convertBtn.addEventListener('click', generatePDF);
}); 