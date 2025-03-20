document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const imageList = document.getElementById('imageList');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    
    // 确保按钮已正确找到
    console.log('初始化时按钮状态:', { 
        convertBtn: convertBtn ? convertBtn.disabled : 'not found',
        clearBtn: clearBtn ? clearBtn.disabled : 'not found',
        selectAllBtn: selectAllBtn ? selectAllBtn.disabled : 'not found',
        deleteSelectedBtn: deleteSelectedBtn ? deleteSelectedBtn.disabled : 'not found'
    });
    
    // 初始时隐藏全选和删除所选按钮
    selectAllBtn.classList.add('hidden');
    deleteSelectedBtn.classList.add('hidden');
    
    // 存储上传的图片
    const uploadedImages = [];
    let isSelectAll = false;
    
    // 确保SortableJS加载正确
    if (typeof Sortable !== 'undefined') {
        // 初始化SortableJS让图片可以拖拽排序
        new Sortable(imageList, {
            animation: 150,
            ghostClass: 'sortable-ghost'
        });
    } else {
        console.error('Sortable库未正确加载!');
    }
    
    // 处理拖放功能
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
    
    // 处理文件拖放
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    // 处理文件选择
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
    
    // 处理上传的文件
    function handleFiles(files) {
        if (files.length === 0) return;
        
        // 如果上传了多张图片，先取消所有现有选择
        if (files.length > 1) {
            const existingSelected = document.querySelectorAll('.image-item.selected');
            existingSelected.forEach(item => {
                item.classList.remove('selected');
            });
            
            // 重置全选状态
            isSelectAll = false;
            if (selectAllBtn) {
                selectAllBtn.textContent = '全选';
            }
        }
        
        Array.from(files).forEach(file => {
            if (file.type.match('image.*')) {
                addImageToList(file);
            }
        });
        
        updateButtonState();
    }
    
    // 添加图片到预览列表
    function addImageToList(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            
            img.onload = function() {
                const imageIndex = uploadedImages.length;
                uploadedImages.push({
                    src: e.target.result,
                    width: img.width,
                    height: img.height,
                    name: file.name,
                    rotation: 0
                });
                
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                imageItem.dataset.index = imageIndex;
                
                // 如果是第一张图片，则自动选中
                if (imageIndex === 0 && document.querySelectorAll('.image-item').length === 0) {
                    imageItem.classList.add('selected');
                }
                
                // 创建图片元素
                const imgEl = document.createElement('img');
                imgEl.src = e.target.result;
                imgEl.alt = file.name;
                imageItem.appendChild(imgEl);
                
                // 创建删除按钮
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '<i class="material-icons">close</i>';
                removeBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const index = parseInt(imageItem.dataset.index);
                    uploadedImages.splice(index, 1);
                    imageItem.remove();
                    
                    // 更新其他图片的索引
                    const items = document.querySelectorAll('.image-item');
                    items.forEach((item, i) => {
                        item.dataset.index = i;
                    });
                    
                    updateButtonState();
                    updateDeleteButtonState();
                });
                
                // 创建旋转控制区域
                const rotateControls = document.createElement('div');
                rotateControls.className = 'rotate-controls';
                
                // 创建旋转按钮
                const rotateLeftBtn = document.createElement('button');
                rotateLeftBtn.className = 'rotate-btn left';
                rotateLeftBtn.textContent = '左旋';
                rotateLeftBtn.title = '向左旋转90°';
                rotateLeftBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const index = parseInt(imageItem.dataset.index);
                    rotateImage(index, -90);
                });
                
                // 创建右旋按钮
                const rotateRightBtn = document.createElement('button');
                rotateRightBtn.className = 'rotate-btn right';
                rotateRightBtn.textContent = '右旋';
                rotateRightBtn.title = '向右旋转90°';
                rotateRightBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const index = parseInt(imageItem.dataset.index);
                    rotateImage(index, 90);
                });
                
                rotateControls.appendChild(rotateLeftBtn);
                rotateControls.appendChild(rotateRightBtn);
                
                // 添加旋转控制区域到图片项
                imageItem.appendChild(rotateControls);
                imageItem.appendChild(removeBtn);
                
                // 添加点击事件，选中图片
                imageItem.addEventListener('click', function() {
                    this.classList.toggle('selected');
                    updateDeleteButtonState();
                    
                    // 更新选择全部按钮状态
                    const totalItems = document.querySelectorAll('.image-item').length;
                    const selectedItems = document.querySelectorAll('.image-item.selected').length;
                    
                    if (selectedItems === totalItems) {
                        isSelectAll = true;
                        selectAllBtn.textContent = '取消全选';
                    } else {
                        isSelectAll = false;
                        selectAllBtn.textContent = '全选';
                    }
                });
                
                imageList.appendChild(imageItem);
                
                updateButtonState();
            };
        };
        
        reader.readAsDataURL(file);
    }
    
    // 添加旋转图片的函数
    function rotateImage(index, degrees) {
        if (index < 0 || index >= uploadedImages.length) return;
        
        // 更新图片旋转角度
        uploadedImages[index].rotation = (uploadedImages[index].rotation + degrees) % 360;
        
        // 如果是负值，转换为等效的正值
        if (uploadedImages[index].rotation < 0) {
            uploadedImages[index].rotation += 360;
        }
        
        // 更新图片样式
        const imageItems = document.querySelectorAll('.image-item');
        if (index < imageItems.length) {
            const img = imageItems[index].querySelector('img');
            if (img) {
                img.style.transform = `rotate(${uploadedImages[index].rotation}deg)`;
            }
        }
    }
    
    // 更新按钮状态
    function updateButtonState() {
        const hasImages = uploadedImages.length > 0;
        console.log('更新按钮状态:', { hasImages, imagesCount: uploadedImages.length });
        
        // 确保按钮被启用
        if (hasImages) {
            convertBtn.disabled = false;
            clearBtn.disabled = false;
            selectAllBtn.disabled = false;
            deleteSelectedBtn.disabled = false;
            
            // 显示全选和删除所选按钮
            selectAllBtn.classList.remove('hidden');
            deleteSelectedBtn.classList.remove('hidden');
            
            // 移除可能被添加的disabled类
            convertBtn.classList.remove('disabled');
            clearBtn.classList.remove('disabled');
            selectAllBtn.classList.remove('disabled');
            deleteSelectedBtn.classList.remove('disabled');
        } else {
            convertBtn.disabled = true;
            clearBtn.disabled = true;
            selectAllBtn.disabled = true;
            deleteSelectedBtn.disabled = true;
            
            // 隐藏全选和删除所选按钮
            selectAllBtn.classList.add('hidden');
            deleteSelectedBtn.classList.add('hidden');
        }
    }
    
    // 确保生成PDF按钮有点击事件
    convertBtn.addEventListener('click', function(e) {
        console.log('生成PDF按钮被点击');
        generatePDF();
    });
    
    function generatePDF() {
        if (uploadedImages.length === 0) return;
        
        // 获取选中的图片项
        const selectedItems = document.querySelectorAll('.image-item.selected');
        
        // 如果有选中的图片，则只处理选中的图片；否则处理所有图片
        let itemsToProcess;
        if (selectedItems.length > 0) {
            itemsToProcess = selectedItems;
        } else {
            itemsToProcess = document.querySelectorAll('.image-item');
        }
        
        // 获取排序后的图片列表
        const sortedImages = Array.from(itemsToProcess).map(item => {
            const index = parseInt(item.dataset.index);
            return uploadedImages[index];
        });
        
        // 显示加载状态
        convertBtn.disabled = true;
        convertBtn.textContent = '处理中...';
        
        // 使用setTimeout允许UI更新
        setTimeout(() => {
            try {
                // 检查jsPDF是否正确加载
                if (typeof window.jspdf === 'undefined') {
                    console.error('jsPDF库未正确加载!');
                    alert('PDF生成组件未正确加载，请检查网络连接后刷新页面重试。');
                    convertBtn.textContent = '生成PDF';
                    convertBtn.disabled = false;
                    return;
                }
                
                // 使用jsPDF创建PDF
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF();
                
                // 处理每张图片
                const processImages = async () => {
                    try {
                        for (let i = 0; i < sortedImages.length; i++) {
                            const img = sortedImages[i];
                            
                            // 如果不是第一页，添加新页
                            if (i > 0) {
                                pdf.addPage();
                            }
                            
                            // 计算最佳适应页面的尺寸
                            const pageWidth = pdf.internal.pageSize.getWidth();
                            const pageHeight = pdf.internal.pageSize.getHeight();
                            
                            // 如果有旋转，创建临时canvas处理旋转后的图像
                            if (img.rotation !== 0) {
                                const tempImg = new Image();
                                tempImg.src = img.src;
                                
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');
                                
                                // 根据旋转角度设置canvas大小
                                let canvasWidth, canvasHeight;
                                
                                if (img.rotation === 90 || img.rotation === 270) {
                                    // 如果旋转了90度或270度，交换宽高
                                    canvasWidth = img.height;
                                    canvasHeight = img.width;
                                } else {
                                    canvasWidth = img.width;
                                    canvasHeight = img.height;
                                }
                                
                                canvas.width = canvasWidth;
                                canvas.height = canvasHeight;
                                
                                // 在canvas中心进行旋转
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
                                
                                // 计算旋转后图像的尺寸
                                let displayWidth = canvasWidth;
                                let displayHeight = canvasHeight;
                                
                                // 适应页面大小
                                const ratio = Math.min(
                                    pageWidth / displayWidth,
                                    pageHeight / displayHeight
                                );
                                
                                displayWidth *= ratio;
                                displayHeight *= ratio;
                                
                                // 居中图片
                                const x = (pageWidth - displayWidth) / 2;
                                const y = (pageHeight - displayHeight) / 2;
                                
                                // 将canvas添加到PDF
                                const imgData = canvas.toDataURL('image/jpeg');
                                pdf.addImage(imgData, 'JPEG', x, y, displayWidth, displayHeight);
                            } else {
                                // 如果没有旋转，直接处理原图
                                let imgWidth = img.width;
                                let imgHeight = img.height;
                                
                                // 适应页面大小
                                const ratio = Math.min(
                                    pageWidth / imgWidth,
                                    pageHeight / imgHeight
                                );
                                
                                imgWidth *= ratio;
                                imgHeight *= ratio;
                                
                                // 居中图片
                                const x = (pageWidth - imgWidth) / 2;
                                const y = (pageHeight - imgHeight) / 2;
                                
                                // 添加图片到PDF
                                pdf.addImage(img.src, 'JPEG', x, y, imgWidth, imgHeight);
                            }
                        }
                        
                        // 使用第一张图片的名称作为PDF文件名
                        let fileName = '图片转换.pdf'; // 默认文件名
                        if (sortedImages.length > 0 && sortedImages[0].name) {
                            // 去除扩展名，添加.pdf
                            const baseName = sortedImages[0].name.replace(/\.[^/.]+$/, "");
                            fileName = baseName + '.pdf';
                        }
                        
                        // 保存PDF
                        pdf.save(fileName);
                    } catch (err) {
                        console.error('处理图片过程中出错:', err);
                        alert('生成PDF过程中出错: ' + err.message);
                    } finally {
                        // 恢复按钮状态
                        convertBtn.textContent = '生成PDF';
                        convertBtn.disabled = false;
                    }
                };
                
                processImages();
            } catch (err) {
                console.error('PDF生成错误:', err);
                alert('生成PDF时发生错误: ' + err.message);
                // 恢复按钮状态
                convertBtn.textContent = '生成PDF';
                convertBtn.disabled = false;
            }
        }, 100);
    }
    
    // 全选按钮点击事件
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
        
        // 更新按钮文本和状态
        selectAllBtn.textContent = isSelectAll ? '取消全选' : '全选';
        updateDeleteButtonState();
    });
    
    // 删除选中图片按钮点击事件
    deleteSelectedBtn.addEventListener('click', function() {
        // 获取所有选中的图片项
        const selectedItems = document.querySelectorAll('.image-item.selected');
        
        // 取消所有选中的图片
        selectedItems.forEach(item => {
            item.classList.remove('selected');
        });
        
        // 重置全选状态
        isSelectAll = false;
        selectAllBtn.textContent = '全选';
        
        // 更新删除按钮状态
        updateDeleteButtonState();
    });
    
    // 图片点击选中/取消选中
    imageList.addEventListener('click', function(e) {
        const imageItem = e.target.closest('.image-item');
        if (!imageItem) return;
        
        // 如果点击的是按钮，不触发选中
        if (e.target.closest('.remove-btn') || e.target.closest('.rotate-controls')) {
            return;
        }
        
        imageItem.classList.toggle('selected');
        updateDeleteButtonState();
        
        // 更新全选按钮状态
        const totalImages = document.querySelectorAll('.image-item').length;
        const selectedImages = document.querySelectorAll('.image-item.selected').length;
        isSelectAll = totalImages === selectedImages;
        selectAllBtn.textContent = isSelectAll ? '取消全选' : '全选';
    });
    
    // 更新删除按钮状态
    function updateDeleteButtonState() {
        const selectedCount = document.querySelectorAll('.image-item.selected').length;
        deleteSelectedBtn.disabled = selectedCount === 0;
    }
    
    // 清除所有图片
    clearBtn.addEventListener('click', function() {
        uploadedImages.length = 0;
        imageList.innerHTML = '';
        isSelectAll = false;
        selectAllBtn.textContent = '全选';
        
        // 隐藏全选和删除所选按钮
        selectAllBtn.classList.add('hidden');
        deleteSelectedBtn.classList.add('hidden');
        
        updateButtonState();
        updateDeleteButtonState();
    });
}); 