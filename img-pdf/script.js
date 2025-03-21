document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const imageList = document.getElementById('imageList');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    
    // Ensure buttons are found correctly
    console.log('Initial button states:', { 
        convertBtn: convertBtn ? convertBtn.disabled : 'not found',
        clearBtn: clearBtn ? clearBtn.disabled : 'not found',
        selectAllBtn: selectAllBtn ? selectAllBtn.disabled : 'not found',
        deleteSelectedBtn: deleteSelectedBtn ? deleteSelectedBtn.disabled : 'not found'
    });
    
    // Initially hide select all and delete selected buttons
    selectAllBtn.classList.add('hidden');
    deleteSelectedBtn.classList.add('hidden');
    
    // Store uploaded and deleted images
    const uploadedImages = [];
    const deletedImages = new Map(); // Use Map to store deleted images, key is image hash, value is {file, timestamp}
    let isSelectAll = false;
    
    // Create toast element
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);

    // Function to show toast messages
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Set icon color
        let iconColor = '#e53935'; // Default main color red
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
        
        // Create content with appropriate style
        toast.innerHTML = `
            <div class="toast-content">
                <i class="material-icons" style="color: ${iconColor}; margin-right: 8px;">${icon}</i>
                <span>${message}</span>
                <button class="toast-close" style="margin-left: 10px; background: none; border: none; cursor: pointer;">
                    <i class="material-icons" style="font-size: 16px; color: #999;">close</i>
                </button>
            </div>
        `;
        
        // Add close button event
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.classList.add('fade-out');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toastContainer.removeChild(toast);
                    }
                }, 300);
            });
        }
        
        toastContainer.appendChild(toast);
        
        // Automatically disappear after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('fade-out');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toastContainer.removeChild(toast);
                    }
                }, 300);
            }
        }, 3000);
    }

    // Calculate file hash (using filename and size as simple hash)
    function getFileHash(file) {
        return `${file.name}-${file.size}`;
    }

    // Check if image is deleted
    function isDeletedImage(file) {
        const hash = getFileHash(file);
        return deletedImages.has(hash);
    }

    // Create recover button
    function createRecoverButton(file) {
        const recoverBtn = document.createElement('button');
        recoverBtn.className = 'recover-btn';
        recoverBtn.textContent = 'Recover Image';
        recoverBtn.onclick = () => {
            const hash = getFileHash(file);
            deletedImages.delete(hash);
            addImageToList(file);
            showToast('Image recovered', 'success');
        };
        return recoverBtn;
    }

    // Ensure SortableJS is loaded correctly
    if (typeof Sortable !== 'undefined') {
        // Initialize SortableJS for drag and drop sorting
        new Sortable(imageList, {
            animation: 150,
            ghostClass: 'sortable-ghost'
        });
    } else {
        console.error('Sortable library not loaded correctly!');
    }
    
    // Handle drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        uploadArea.classList.add('highlight');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('highlight');
    }
    
    // Handle file drop
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    // Handle file selection
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
        // Reset input value so the same file can trigger change event again
        this.value = '';
    });
    
    // Handle uploaded files
    function handleFiles(files) {
        if (files.length === 0) return;
        
        // If multiple images are uploaded, cancel all existing selections
        if (files.length > 1) {
            const existingSelected = document.querySelectorAll('.image-item.selected');
            existingSelected.forEach(item => {
                item.classList.remove('selected');
            });
            
            isSelectAll = false;
            if (selectAllBtn) {
                selectAllBtn.textContent = 'Select All';
            }
        }
        
        let addedCount = 0;
        
        Array.from(files).forEach(file => {
            if (file.type.match('image.*')) {
                // Check if image was previously deleted
                if (isDeletedImage(file)) {
                    const confirmRecover = confirm('This image was previously deleted. Do you want to recover it?');
                    if (confirmRecover) {
                        const hash = getFileHash(file);
                        deletedImages.delete(hash);
                        addImageToList(file);
                        showToast('Image recovered', 'success');
                        addedCount++;
                    }
                    return;
                }

                addImageToList(file);
                addedCount++;
                
                // Show toast for single image upload
                if (files.length === 1) {
                    showToast('Image uploaded successfully', 'success');
                }
            }
        });
        
        // Show statistics toast for multiple image upload
        if (files.length > 1 && addedCount > 0) {
            showToast(`Successfully added ${addedCount} images`, 'success');
        }
        
        updateButtonState();
    }
    
    // Add image to preview list
    function addImageToList(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            
            img.onload = function() {
                const imageIndex = document.querySelectorAll('.image-item').length;
                const imageData = {
                    file: file,
                    src: e.target.result,
                    width: img.width,
                    height: img.height,
                    name: file.name,
                    rotation: 0
                };
                uploadedImages.push(imageData);
                
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                imageItem.dataset.index = imageIndex;
                
                // Create image element
                const imgEl = document.createElement('img');
                imgEl.src = e.target.result;
                imgEl.alt = file.name;
                
                // Image click preview functionality
                imgEl.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent bubble, avoid triggering selection functionality
                    previewImage(imageData);
                });
                
                imageItem.appendChild(imgEl);
                
                // Create delete button
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '<i class="material-icons">close</i>';
                removeBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    removeImage(imageItem, file);
                });
                
                // Create rotation control area
                const rotateControls = document.createElement('div');
                rotateControls.className = 'rotate-controls';
                
                // Create rotation button
                const rotateLeftBtn = document.createElement('button');
                rotateLeftBtn.className = 'rotate-btn left';
                rotateLeftBtn.textContent = 'Left';
                rotateLeftBtn.title = 'Rotate 90° Left';
                rotateLeftBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const index = parseInt(imageItem.dataset.index);
                    rotateImage(index, -90);
                });
                
                // Create right rotate button
                const rotateRightBtn = document.createElement('button');
                rotateRightBtn.className = 'rotate-btn right';
                rotateRightBtn.textContent = 'Right';
                rotateRightBtn.title = 'Rotate 90° Right';
                rotateRightBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const index = parseInt(imageItem.dataset.index);
                    rotateImage(index, 90);
                });
                
                rotateControls.appendChild(rotateLeftBtn);
                rotateControls.appendChild(rotateRightBtn);
                
                // Add rotation control area to image item
                imageItem.appendChild(rotateControls);
                imageItem.appendChild(removeBtn);
                
                imageList.appendChild(imageItem);
                
                updateButtonState();
                updateDeleteButtonState();
            };
        };
        
        reader.readAsDataURL(file);
    }
    
    // Add rotated image function
    function rotateImage(index, degrees) {
        if (index < 0 || index >= uploadedImages.length) return;
        
        // Update image rotation angle
        uploadedImages[index].rotation = (uploadedImages[index].rotation + degrees) % 360;
        
        // If negative, convert to equivalent positive
        if (uploadedImages[index].rotation < 0) {
            uploadedImages[index].rotation += 360;
        }
        
        // Update image style
        const imageItems = document.querySelectorAll('.image-item');
        if (index < imageItems.length) {
            const img = imageItems[index].querySelector('img');
            if (img) {
                img.style.transform = `rotate(${uploadedImages[index].rotation}deg)`;
            }
        }
    }
    
    // Update button state
    function updateButtonState() {
        const hasImages = uploadedImages.length > 0;
        console.log('Update button state:', { hasImages, imagesCount: uploadedImages.length });
        
        // Ensure button is enabled
        if (hasImages) {
            convertBtn.disabled = false;
            clearBtn.disabled = false;
            selectAllBtn.disabled = false;
            deleteSelectedBtn.disabled = false;
            
            // Show select all and delete selected buttons
            selectAllBtn.classList.remove('hidden');
            deleteSelectedBtn.classList.remove('hidden');
            
            // Remove possible added disabled class
            convertBtn.classList.remove('disabled');
            clearBtn.classList.remove('disabled');
            selectAllBtn.classList.remove('disabled');
            deleteSelectedBtn.classList.remove('disabled');
        } else {
            convertBtn.disabled = true;
            clearBtn.disabled = true;
            selectAllBtn.disabled = true;
            deleteSelectedBtn.disabled = true;
            
            // Hide select all and delete selected buttons
            selectAllBtn.classList.add('hidden');
            deleteSelectedBtn.classList.add('hidden');
        }
    }
    
    // Ensure generate PDF button has click event
    convertBtn.addEventListener('click', function(e) {
        console.log('Generate PDF button clicked');
        generatePDF();
    });
    
    function generatePDF() {
        if (uploadedImages.length === 0) return;
        
        // Get selected image items
        const selectedItems = document.querySelectorAll('.image-item.selected');
        
        // If there are selected images, process only selected images; otherwise, process all images
        let itemsToProcess;
        if (selectedItems.length > 0) {
            itemsToProcess = selectedItems;
        } else {
            itemsToProcess = document.querySelectorAll('.image-item');
        }
        
        // Get sorted image list
        const sortedImages = Array.from(itemsToProcess).map(item => {
            const index = parseInt(item.dataset.index);
            return uploadedImages[index];
        });
        
        // Show loading status
        convertBtn.disabled = true;
        convertBtn.textContent = 'Processing...';
        
        // Use setTimeout to allow UI update
        setTimeout(() => {
            try {
                // Check if jsPDF is loaded correctly
                if (typeof window.jspdf === 'undefined') {
                    console.error('jsPDF library not loaded correctly!');
                    alert('PDF generation component not loaded correctly, please check network connection and refresh page to try again.');
                    convertBtn.textContent = 'Generate PDF';
                    convertBtn.disabled = false;
                    return;
                }
                
                // Use jsPDF to create PDF
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF();
                
                // Process each image
                const processImages = async () => {
                    try {
                        for (let i = 0; i < sortedImages.length; i++) {
                            const img = sortedImages[i];
                            
                            // If not first page, add new page
                            if (i > 0) {
                                pdf.addPage();
                            }
                            
                            // Calculate best fit page size
                            const pageWidth = pdf.internal.pageSize.getWidth();
                            const pageHeight = pdf.internal.pageSize.getHeight();
                            
                            // If rotated, create temporary canvas for processing rotated image
                            if (img.rotation !== 0) {
                                const tempImg = new Image();
                                tempImg.src = img.src;
                                
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');
                                
                                // Set canvas size based on rotation angle
                                let canvasWidth, canvasHeight;
                                
                                if (img.rotation === 90 || img.rotation === 270) {
                                    // If rotated 90 or 270 degrees, swap width and height
                                    canvasWidth = img.height;
                                    canvasHeight = img.width;
                                } else {
                                    canvasWidth = img.width;
                                    canvasHeight = img.height;
                                }
                                
                                canvas.width = canvasWidth;
                                canvas.height = canvasHeight;
                                
                                // Rotate image in canvas center
                                ctx.save();
                                ctx.translate(canvasWidth / 2, canvasHeight / 2);
                                ctx.rotate((img.rotation * Math.PI) / 180);
                                ctx.drawImage(
                                    tempImg,
                                    -img.width / 2,
                                    -img.height / 2,
                                    img.width,
                                    img.height
                                );
                                ctx.restore();
                                
                                // Calculate rotated image size
                                let displayWidth = canvasWidth;
                                let displayHeight = canvasHeight;
                                
                                // Fit to page size
                                const ratio = Math.min(
                                    pageWidth / displayWidth,
                                    pageHeight / displayHeight
                                );
                                
                                displayWidth *= ratio;
                                displayHeight *= ratio;
                                
                                // Center image
                                const x = (pageWidth - displayWidth) / 2;
                                const y = (pageHeight - displayHeight) / 2;
                                
                                // Add canvas to PDF
                                const imgData = canvas.toDataURL('image/jpeg');
                                pdf.addImage(imgData, 'JPEG', x, y, displayWidth, displayHeight);
                            } else {
                                // If not rotated, process original image directly
                                let imgWidth = img.width;
                                let imgHeight = img.height;
                                
                                // Fit to page size
                                const ratio = Math.min(
                                    pageWidth / imgWidth,
                                    pageHeight / imgHeight
                                );
                                
                                imgWidth *= ratio;
                                imgHeight *= ratio;
                                
                                // Center image
                                const x = (pageWidth - imgWidth) / 2;
                                const y = (pageHeight - imgHeight) / 2;
                                
                                // Add image to PDF
                                pdf.addImage(img.src, 'JPEG', x, y, imgWidth, imgHeight);
                            }
                        }
                        
                        // Use first image name as PDF file name
                        let fileName = 'Image Conversion.pdf'; // Default file name
                        if (sortedImages.length > 0 && sortedImages[0].name) {
                            // Remove extension, add .pdf
                            const baseName = sortedImages[0].name.replace(/\.[^/.]+$/, "");
                            fileName = baseName + '.pdf';
                        }
                        
                        // Save PDF
                        pdf.save(fileName);
                    } catch (err) {
                        console.error('Error processing image:', err);
                        alert('Error occurred while generating PDF: ' + err.message);
                    } finally {
                        // Restore button state
                        convertBtn.textContent = 'Generate PDF';
                        convertBtn.disabled = false;
                    }
                };
                
                processImages();
            } catch (err) {
                console.error('PDF generation error:', err);
                alert('Error occurred while generating PDF: ' + err.message);
                // Restore button state
                convertBtn.textContent = 'Generate PDF';
                convertBtn.disabled = false;
            }
        }, 100);
    }
    
    // Select all button click event
    selectAllBtn.addEventListener('click', function() {
        isSelectAll = !isSelectAll;
        const imageItems = document.querySelectorAll('.image-item');
        
        imageItems.forEach(item => {
            if (isSelectAll) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
        
        // Update button text and state
        selectAllBtn.textContent = isSelectAll ? 'Cancel Select All' : 'Select All';
        updateDeleteButtonState();
    });
    
    // Delete selected images button click event
    deleteSelectedBtn.addEventListener('click', function() {
        // Get all selected image items
        const selectedItems = document.querySelectorAll('.image-item.selected');
        
        // If no images are selected, return
        if (selectedItems.length === 0) return;
        
        // Get all selected item indices (sorted from largest to smallest to avoid affecting other indices when deleting)
        const selectedIndices = Array.from(selectedItems)
            .map(item => parseInt(item.dataset.index))
            .sort((a, b) => b - a); // Sort from largest to smallest
        
        // Delete images in descending order of index (to avoid deleting previous items affecting subsequent item indices)
        selectedIndices.forEach(index => {
            if (index >= 0 && index < uploadedImages.length) {
                // Delete from array
                uploadedImages.splice(index, 1);
                // Delete from DOM
                const itemToRemove = document.querySelector(`.image-item[data-index="${index}"]`);
                if (itemToRemove) {
                    itemToRemove.remove();
                }
            }
        });
        
        // Update remaining image indices
        const remainingItems = document.querySelectorAll('.image-item');
        remainingItems.forEach((item, i) => {
            item.dataset.index = i;
        });
        
        // Reset select all state
        isSelectAll = false;
        selectAllBtn.textContent = 'Select All';
        
        // Update button state
        updateButtonState();
        updateDeleteButtonState();
    });
    
    // Image click select/unselect
    imageList.addEventListener('click', function(e) {
        const imageItem = e.target.closest('.image-item');
        if (!imageItem) return;
        
        // If clicked is button, do not trigger select
        if (e.target.closest('.remove-btn') || e.target.closest('.rotate-controls') || e.target.tagName === 'IMG') {
            return;
        }
        
        imageItem.classList.toggle('selected');
        updateDeleteButtonState();
        
        // Update select all button state
        const totalImages = document.querySelectorAll('.image-item').length;
        const selectedImages = document.querySelectorAll('.image-item.selected').length;
        isSelectAll = totalImages === selectedImages;
        selectAllBtn.textContent = isSelectAll ? 'Cancel Select All' : 'Select All';
    });
    
    // Update delete button state
    function updateDeleteButtonState() {
        const selectedCount = document.querySelectorAll('.image-item.selected').length;
        deleteSelectedBtn.disabled = selectedCount === 0;
    }
    
    // Clear all images
    clearBtn.addEventListener('click', function() {
        // Clear image array
        uploadedImages.length = 0;
        
        // Clear image list DOM, but keep event listeners
        while (imageList.firstChild) {
            imageList.removeChild(imageList.firstChild);
        }
        
        // Reset select state
        isSelectAll = false;
        selectAllBtn.textContent = 'Select All';
        
        // Hide select all and delete selected buttons
        selectAllBtn.classList.add('hidden');
        deleteSelectedBtn.classList.add('hidden');
        
        updateButtonState();
        updateDeleteButtonState();
    });

    // Preview image functionality
    function previewImage(image) {
        // Create preview modal
        const modal = document.createElement('div');
        modal.className = 'image-preview-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        // Create preview container
        const previewContainer = document.createElement('div');
        previewContainer.className = 'preview-container';
        previewContainer.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 90%;
            max-height: 90%;
            overflow: auto;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
            position: relative;
            display: flex;
            flex-direction: column;
        `;
        
        // Create image title
        const titleBar = document.createElement('div');
        titleBar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        `;
        
        const title = document.createElement('h3');
        title.textContent = image.name || 'Image Preview';
        title.style.cssText = `
            margin: 0;
            color: #333;
            font-size: 18px;
            font-weight: 500;
        `;
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="material-icons">close</i>';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            font-size: 24px;
            color: #999;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        `;
        closeBtn.addEventListener('mouseover', function() {
            this.style.color = '#e53935';
        });
        closeBtn.addEventListener('mouseout', function() {
            this.style.color = '#999';
        });
        
        closeBtn.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        titleBar.appendChild(title);
        titleBar.appendChild(closeBtn);
        
        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = `
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 15px;
            overflow: hidden;
        `;
        
        // Create image element
        const img = document.createElement('img');
        img.src = image.src;
        img.alt = image.name || 'Preview Image';
        img.style.cssText = `
            max-width: 100%;
            max-height: 70vh;
            object-fit: contain;
            transform: rotate(${image.rotation || 0}deg);
        `;
        
        imageContainer.appendChild(img);
        
        // Create image information
        const infoContainer = document.createElement('div');
        infoContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            color: #666;
        `;
        
        const dimensions = document.createElement('span');
        dimensions.textContent = `Dimensions: ${image.width} × ${image.height} pixels`;
        
        infoContainer.appendChild(dimensions);
        
        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.innerHTML = '<i class="material-icons">file_download</i> Download Image';
        downloadBtn.style.cssText = `
            padding: 8px 16px;
            background: linear-gradient(to right, #e53935, #f44336);
            color: white;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            margin-top: 15px;
            align-self: center;
            display: flex;
            align-items: center;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(229, 57, 53, 0.3);
            transition: all 0.2s;
        `;
        
        downloadBtn.addEventListener('mouseover', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(229, 57, 53, 0.4)';
        });
        
        downloadBtn.addEventListener('mouseout', function() {
            this.style.transform = '';
            this.style.boxShadow = '0 2px 5px rgba(229, 57, 53, 0.3)';
        });
        
        downloadBtn.addEventListener('click', function() {
            const link = document.createElement('a');
            link.href = image.src;
            link.download = image.name || 'download.jpg';
            link.click();
        });
        
        // Add elements to preview container
        previewContainer.appendChild(titleBar);
        previewContainer.appendChild(imageContainer);
        previewContainer.appendChild(infoContainer);
        previewContainer.appendChild(downloadBtn);
        
        // Add preview container to modal
        modal.appendChild(previewContainer);
        
        // Click modal background to close
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Add modal to body
        document.body.appendChild(modal);
    }

    // Modify delete image processing
    function removeImage(imageItem, file) {
        const hash = getFileHash(file);
        deletedImages.set(hash, {
            file: file,
            timestamp: new Date().getTime()
        });
        
        const index = parseInt(imageItem.dataset.index);
        if (index >= 0 && index < uploadedImages.length) {
            uploadedImages.splice(index, 1);
            
            // Update remaining image indices
            const remainingItems = document.querySelectorAll('.image-item');
            remainingItems.forEach((item, i) => {
                item.dataset.index = i;
            });
        }
        
        imageList.removeChild(imageItem);
        updateButtonState();
        updateDeleteButtonState();
        showToast('Image deleted, can be re-uploaded to recover', 'info');
    }
}); 