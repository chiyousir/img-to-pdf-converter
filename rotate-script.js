document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const imageList = document.getElementById('imageList');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    // 确保按钮已正确找到
    console.log('初始化时按钮状态:', { 
        convertBtn: convertBtn ? convertBtn.disabled : 'not found',
        clearBtn: clearBtn ? clearBtn.disabled : 'not found'
    });
    
    // 存储上传的图片
    const uploadedImages = [];
    
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
        
        Array.from(files).forEach(file => {
            if (file.type.match('image.*')) {
                addImageToList(file);
            }
        });
        
        updateButtonState();
    }
    
    // 添加图片到预览列表
    function addImageToList(file) {
        // 创建文件读取器
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // 创建图片对象用于获取宽高
            const img = new Image();
            img.src = e.target.result;
            
            img.onload = function() {
                // 添加到上传图片数组
                uploadedImages.push({
                    src: e.target.result,
                    width: img.width,
                    height: img.height,
                    name: file.name
                });
                
                // 创建图片预览元素
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                imageItem.dataset.index = uploadedImages.length - 1;
                
                // 创建图片元素
                const imgEl = document.createElement('img');
                imgEl.src = e.target.result;
                imgEl.alt = file.name;
                
                // 创建删除按钮
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '×';
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
                });
                
                // 添加到DOM
                imageItem.appendChild(imgEl);
                imageItem.appendChild(removeBtn);
                imageList.appendChild(imageItem);
                
                // 图片添加后立即更新按钮状态
                updateButtonState();
                console.log('图片添加后按钮状态:', { 
                    convertBtn: convertBtn.disabled, 
                    uploadedImages: uploadedImages.length 
                });
            };
        };
        
        reader.readAsDataURL(file);
    }
    
    // 更新按钮状态
    function updateButtonState() {
        const hasImages = uploadedImages.length > 0;
        console.log('更新按钮状态:', { hasImages, imagesCount: uploadedImages.length });
        
        // 确保按钮被启用
        if (hasImages) {
            convertBtn.disabled = false;
            clearBtn.disabled = false;
            
            // 移除可能被添加的disabled类
            convertBtn.classList.remove('disabled');
            clearBtn.classList.remove('disabled');
        } else {
            convertBtn.disabled = true;
            clearBtn.disabled = true;
        }
    }
    
    // 确保生成PDF按钮有点击事件
    convertBtn.addEventListener('click', function(e) {
        console.log('生成PDF按钮被点击');
        generatePDF();
    });
    
    function generatePDF() {
        console.log('执行generatePDF函数, 图片数量:', uploadedImages.length);
        if (uploadedImages.length === 0) {
            console.warn('没有图片可以生成PDF');
            return;
        }
        
        // 获取排序后的图片列表
        const items = document.querySelectorAll('.image-item');
        const sortedImages = Array.from(items).map(item => {
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
                            
                            let imgWidth = img.width;
                            let imgHeight = img.height;
                            
                            // 适应页面大小
                            const ratio = Math.min(
                                pageWidth / imgWidth,
                                pageHeight / imgHeight
                            );
                            
                            imgWidth = imgWidth * ratio;
                            imgHeight = imgHeight * ratio;
                            
                            // 居中图片
                            const x = (pageWidth - imgWidth) / 2;
                            const y = (pageHeight - imgHeight) / 2;
                            
                            // 添加图片到PDF
                            pdf.addImage(img.src, 'JPEG', x, y, imgWidth, imgHeight);
                        }
                        
                        console.log('PDF生成完成，准备下载');
                        
                        // 使用第一张图片的名称作为PDF文件名
                        let fileName = '图片转换.pdf'; // 默认文件名
                        if (sortedImages.length > 0 && sortedImages[0].name) {
                            // 去除扩展名，添加.pdf
                            const baseName = sortedImages[0].name.replace(/\.[^/.]+$/, "");
                            fileName = baseName + '.pdf';
                        }
                        console.log('生成的PDF文件名:', fileName);
                        
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
    
    // 清除所有图片
    clearBtn.addEventListener('click', function() {
        uploadedImages.length = 0;
        imageList.innerHTML = '';
        updateButtonState();
    });
}); 