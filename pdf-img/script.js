// 确保PDF.js正确加载
if (typeof pdfjsLib === 'undefined') {
    pdfjsLib = window.pdfjsLib;
}

// 初始化PDF.js Worker
if (pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.5.141/pdf.worker.min.js';
}

// 主要DOM元素
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

// 全局变量
let currentPdfFile = null;
let pdfDocument = null;
let pdfPages = 0;
let convertedImages = [];
let isConverting = false;

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 拖放事件
    setupDragAndDrop();
    
    // 文件选择事件
    fileInput.addEventListener('change', handleFileSelect);
    
    // 转换按钮点击事件
    convertBtn.addEventListener('click', convertPdfToImages);
    
    // 清除按钮点击事件
    clearBtn.addEventListener('click', clearAll);
    
    // 下载按钮点击事件
    downloadAllBtn.addEventListener('click', downloadAllImages);
});

// 设置拖放功能
function setupDragAndDrop() {
    // 防止浏览器默认行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // 高亮拖放区域
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    // 处理拖放文件
    uploadArea.addEventListener('drop', handleDrop, false);
}

// 阻止默认行为
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// 高亮上传区域
function highlight() {
    uploadArea.classList.add('highlight');
}

// 取消高亮上传区域
function unhighlight() {
    uploadArea.classList.remove('highlight');
}

// 处理拖放文件
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        // 只处理第一个文件
        const file = files[0];
        if (file.type === 'application/pdf') {
            handlePdfFile(file);
        } else {
            showToast('请上传PDF文件', 'error');
        }
    }
}

// 处理文件选择
function handleFileSelect(e) {
    const files = e.target.files;
    
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf') {
            handlePdfFile(file);
        } else {
            showToast('请上传PDF文件', 'error');
        }
    }
}

// 处理PDF文件
async function handlePdfFile(file) {
    try {
        // 如果文件太大，显示警告
        if (file.size > 200 * 1024 * 1024) { // 200MB
            showToast('文件较大，转换可能需要较长时间', 'warning');
        }
        
        // 存储当前PDF文件
        currentPdfFile = file;
        
        // 加载PDF文件
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        
        pdfDocument = await loadingTask.promise;
        pdfPages = pdfDocument.numPages;
        
        // 显示PDF基本信息
        showPdfInfo(file, pdfDocument);
        
        // 显示转换选项
        conversionOptions.style.display = 'block';
        
        // 显示控制按钮区域
        document.querySelector('.controls').style.display = 'flex';
        
        // 激活转换和清除按钮
        convertBtn.disabled = false;
        clearBtn.disabled = false;
        
        showToast('PDF文件已加载成功，开始自动转换', 'success');
        
        // 自动开始转换
        convertPdfToImages();
    } catch (error) {
        console.error('PDF加载错误:', error);
        showToast('PDF文件加载失败，请检查文件是否有效', 'error');
    }
}

// 只显示PDF基本信息，不显示预览
function showPdfInfo(file, pdfDoc) {
    // 清空预览区域
    pdfPreview.innerHTML = '';
    
    // 创建PDF信息区域
    const pdfInfo = document.createElement('div');
    pdfInfo.className = 'pdf-info';
    
    // 左侧信息
    const pdfInfoLeft = document.createElement('div');
    pdfInfoLeft.className = 'pdf-info-left';
    
    // PDF图标
    const pdfIcon = document.createElement('div');
    pdfIcon.className = 'pdf-icon';
    pdfIcon.innerHTML = '<i class="material-icons">picture_as_pdf</i>';
    
    // 添加文件加载动画
    pdfIcon.style.transform = 'scale(0.8)';
    pdfIcon.style.opacity = '0';
    
    // PDF详情
    const pdfDetails = document.createElement('div');
    pdfDetails.className = 'pdf-details';
    pdfDetails.innerHTML = `
        <h4>${file.name}</h4>
        <p>${formatFileSize(file.size)} | ${pdfDoc.numPages} 页</p>
    `;
    
    // 细节动画准备
    pdfDetails.style.transform = 'translateY(10px)';
    pdfDetails.style.opacity = '0';
    
    pdfInfoLeft.appendChild(pdfIcon);
    pdfInfoLeft.appendChild(pdfDetails);
    pdfInfo.appendChild(pdfInfoLeft);
    
    // 添加到预览区域
    pdfPreview.appendChild(pdfInfo);
    pdfPreview.style.display = 'block';
    
    // 应用入场动画
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

// 创建页面缩略图
async function createPageThumbnail(page, pageNumber) {
    const viewport = page.getViewport({ scale: 0.3 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // 渲染页面到canvas
    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;
    
    // 创建缩略图容器
    const thumbnail = document.createElement('div');
    thumbnail.className = 'page-thumbnail';
    
    // 转换canvas为图片
    const img = document.createElement('img');
    img.src = canvas.toDataURL();
    thumbnail.appendChild(img);
    
    // 添加页码
    const pageNumberDiv = document.createElement('div');
    pageNumberDiv.className = 'page-number';
    pageNumberDiv.textContent = `第 ${pageNumber} 页`;
    thumbnail.appendChild(pageNumberDiv);
    
    return thumbnail;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 转换PDF为图片
async function convertPdfToImages() {
    if (!pdfDocument || isConverting) return;
    
    try {
        isConverting = true;
        convertedImages = [];
        
        // 隐藏转换按钮，突出显示清除按钮
        convertBtn.style.display = 'none';
        clearBtn.style.flex = '1';
        
        // 显示转换状态
        showConvertingStatus();
        
        // 使用固定的高质量设置
        const format = 'jpg'; // 固定为jpg格式
        const quality = 1.0; // 最高质量100%
        const dpi = 300; // 最高分辨率DPI
        
        // 计算缩放比例
        const scale = dpi / 72; // 72是PDF的默认DPI
        
        // 显示转换进度
        updateConvertingStatus(`初始化转换引擎...`, 0);
        await sleep(500); // 小延迟使UI更新可见
        
        // 逐页转换
        let processedPages = 0;
        
        // 首先准备所有页面，避免重复加载
        updateConvertingStatus(`正在分析PDF文档...`, 5);
        await sleep(300);
        
        // 添加一些随机等待，使进度更自然
        updateConvertingStatus(`正在准备转换 ${pdfPages} 页...`, 10);
        await sleep(500);
        
        for (let i = 1; i <= pdfPages; i++) {
            try {
                updateConvertingStatus(`正在处理第 ${i} 页...`, (processedPages / pdfPages) * 80 + 10);
                
                const page = await pdfDocument.getPage(i);
                const imageData = await renderPageToImage(page, scale, format, quality);
                
                convertedImages.push({
                    pageNumber: i,
                    data: imageData,
                    format: format
                });
                
                processedPages++;
                const progressPercentage = (processedPages / pdfPages) * 80 + 10; // 10-90%的进度区间
                updateConvertingStatus(`已转换 ${processedPages}/${pdfPages} 页`, progressPercentage);
                
                // 对于长文档，减少每个页面之间的延迟
                if (pdfPages > 10) {
                    await sleep(50);
                } else {
                    await sleep(100); // 较短的文档可以有更自然的延迟
                }
            } catch (error) {
                console.error(`转换第 ${i} 页时出错:`, error);
                showToast(`转换第 ${i} 页时出错`, 'error');
            }
        }
        
        // 完成转换，处理结果
        updateConvertingStatus(`正在整理转换结果...`, 90);
        await sleep(500);
        
        updateConvertingStatus(`转换完成，准备生成预览...`, 95);
        await sleep(300);
        
        // 转换完成
        hideConvertingStatus();
        
        if (convertedImages.length > 0) {
            showToast(`转换完成，可以下载 ${convertedImages.length} 页图片`, 'success');
            displayResults();
        } else {
            showToast('转换失败，未能生成任何图片', 'error');
        }
    } catch (error) {
        console.error('转换过程出错:', error);
        showToast('转换过程中出现错误', 'error');
        hideConvertingStatus();
    } finally {
        isConverting = false;
    }
}

// 辅助函数：等待指定的毫秒数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 将页面渲染为图片
async function renderPageToImage(page, scale, format, quality) {
    const viewport = page.getViewport({ scale: scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // 背景设为白色
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // 渲染页面到canvas
    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;
    
    // 转换canvas为图像数据
    return format === 'jpg' 
        ? canvas.toDataURL('image/jpeg', quality) 
        : canvas.toDataURL('image/png');
}

// 显示转换中状态
function showConvertingStatus() {
    // 先清除可能存在的状态元素
    const existingStatus = document.querySelector('.converting-status');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    // 创建转换状态元素
    const convertingStatus = document.createElement('div');
    convertingStatus.className = 'converting-status';
    convertingStatus.style.display = 'block';
    convertingStatus.innerHTML = `
        <div class="section-title pulse-effect">
            <i class="material-icons">autorenew</i>
            <h3>正在转换中</h3>
        </div>
        <div class="spinner"></div>
        <p class="status-text" id="statusText">准备转换...</p>
        <div class="page-counter" id="pageCounter">0/${pdfPages} 页</div>
        <div class="progress-container">
            <div class="progress-bar" id="convertProgress"></div>
        </div>
        <p class="conversion-note">转换过程可能需要一些时间，请耐心等待</p>
    `;
    
    // 插入到转换按钮后面
    const controls = document.querySelector('.controls');
    controls.parentNode.insertBefore(convertingStatus, controls.nextSibling);
    
    // 禁用转换按钮
    convertBtn.disabled = true;
    
    // 滚动到状态区域
    convertingStatus.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// 更新转换状态
function updateConvertingStatus(text, percentage) {
    const statusText = document.getElementById('statusText');
    const progressBar = document.getElementById('convertProgress');
    const pageCounter = document.getElementById('pageCounter');
    
    if (statusText && progressBar) {
        statusText.textContent = text;
        progressBar.style.width = `${percentage}%`;
        
        // 更新页面计数
        if (pageCounter) {
            const processedPages = Math.round((percentage / 100) * pdfPages);
            pageCounter.textContent = `${processedPages}/${pdfPages} 页`;
        }
        
        // 在进度接近完成时更新状态文本
        if (percentage > 95) {
            statusText.textContent = "即将完成转换...";
        }
    }
}

// 隐藏转换状态
function hideConvertingStatus() {
    const convertingStatus = document.querySelector('.converting-status');
    if (convertingStatus) {
        // 更新最终状态
        const statusText = document.getElementById('statusText');
        const progressBar = document.getElementById('convertProgress');
        const pageCounter = document.getElementById('pageCounter');
        
        if (statusText && progressBar && pageCounter) {
            statusText.textContent = "转换完成!";
            progressBar.style.width = "100%";
            pageCounter.textContent = `${pdfPages}/${pdfPages} 页`;
        }
        
        // 添加成功动画
        const spinner = convertingStatus.querySelector('.spinner');
        if (spinner) {
            spinner.style.borderTopColor = '#2ecc71';
            spinner.style.borderLeftColor = '#2ecc71';
            spinner.style.animation = 'none';
            spinner.innerHTML = '<i class="material-icons" style="font-size: 36px; color: #2ecc71; line-height: 64px;">check_circle</i>';
        }
        
        // 延迟后淡出
        setTimeout(() => {
            convertingStatus.style.opacity = '0';
            convertingStatus.style.transition = 'opacity 0.5s ease';
            
            // 继续延迟后移除
            setTimeout(() => {
                convertingStatus.remove();
            }, 500);
        }, 1000);
    }
    
    // 启用转换按钮
    convertBtn.disabled = false;
}

// 显示转换结果
function displayResults() {
    // 清空结果区域
    resultArea.innerHTML = '';
    
    // 添加结果标题
    const resultTitle = document.createElement('div');
    resultTitle.className = 'section-title';
    resultTitle.innerHTML = `<i class="material-icons">check_circle</i><h3>转换完成 (${convertedImages.length} 页)</h3>`;
    resultArea.appendChild(resultTitle);
    
    // 创建结果项
    for (const image of convertedImages) {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        // 图片
        const img = document.createElement('img');
        img.src = image.data;
        img.alt = `Page ${image.pageNumber}`;
        img.addEventListener('click', () => downloadSingleImage(image));
        resultItem.appendChild(img);
        
        // 页码信息
        const pageInfo = document.createElement('div');
        pageInfo.className = 'page-info';
        pageInfo.innerHTML = `<span>第 ${image.pageNumber} 页</span> <i class="material-icons download-icon">download</i>`;
        
        // 添加下载事件
        pageInfo.querySelector('.download-icon').addEventListener('click', (e) => {
            e.stopPropagation();
            downloadSingleImage(image);
        });
        
        resultItem.appendChild(pageInfo);
        
        // 添加到结果区域
        resultArea.appendChild(resultItem);
    }
    
    // 显示下载选项
    downloadOptions.style.display = 'flex';
    
    // 自动滚动到下载选项
    downloadOptions.scrollIntoView({ behavior: 'smooth' });
    
    // 高亮下载按钮
    downloadAllBtn.classList.add('highlight-btn');
    setTimeout(() => {
        downloadAllBtn.classList.remove('highlight-btn');
    }, 2000);
}

// 图片预览
function previewImage(image) {
    // 检查是否已存在预览模态框
    let previewModal = document.getElementById('previewModal');
    
    if (!previewModal) {
        // 创建预览模态框
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
        
        // 点击背景关闭预览
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                closePreview();
            }
        });
        
        document.body.appendChild(previewModal);
    }
    
    // 设置预览内容
    previewModal.innerHTML = `
        <div style="max-width: 90%; max-height: 90%; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); position: relative;">
            <img src="${image.data}" style="max-width: 100%; max-height: calc(90vh - 80px); display: block; object-fit: contain;">
            <div style="padding: 15px; display: flex; justify-content: space-between; align-items: center; background: #f1f8e9; border-top: 1px solid #c8e6c9;">
                <div style="font-size: 0.9rem; color: #424242;">
                    第 ${image.pageNumber} 页 | JPG 格式 | 300 DPI | 原图质量
                </div>
                <div>
                    <button id="downloadPreviewBtn" style="background: linear-gradient(135deg, #4caf50, #2e7d32); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                        <i class="material-icons" style="font-size: 18px;">download</i> 下载此图片
                    </button>
                </div>
            </div>
            <div style="position: absolute; top: 15px; right: 15px; width: 30px; height: 30px; background: rgba(0, 0, 0, 0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;" id="closePreviewBtn">
                <i class="material-icons" style="color: white; font-size: 20px;">close</i>
            </div>
        </div>
    `;
    
    // 显示预览
    setTimeout(() => {
        previewModal.style.opacity = '1';
    }, 10);
    
    // 添加下载事件
    document.getElementById('downloadPreviewBtn').addEventListener('click', () => {
        downloadSingleImage(image);
    });
    
    // 添加关闭事件
    document.getElementById('closePreviewBtn').addEventListener('click', closePreview);
    
    // 阻止滚动
    document.body.style.overflow = 'hidden';
}

// 关闭预览
function closePreview() {
    const previewModal = document.getElementById('previewModal');
    
    if (previewModal) {
        previewModal.style.opacity = '0';
        
        // 延迟移除
        setTimeout(() => {
            previewModal.remove();
            // 恢复滚动
            document.body.style.overflow = '';
        }, 300);
    }
}

// 下载单个图片
function downloadSingleImage(image) {
    const fileName = getFileName(currentPdfFile.name, image.pageNumber, image.format);
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = image.data;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 批量下载所有图片
async function downloadAllImages() {
    if (!convertedImages.length) return;
    
    try {
        // 显示加载状态
        showToast('正在准备下载...', 'info');
        
        // 加载JSZip库
        if (typeof JSZip === 'undefined') {
            await loadJSZip();
        }
        
        const zip = new JSZip();
        const folder = zip.folder('images');
        
        // 添加所有图片到zip
        convertedImages.forEach(image => {
            const fileName = getFileName('page', image.pageNumber, image.format);
            const dataURL = image.data;
            const base64Data = dataURL.split(',')[1];
            folder.file(fileName, base64Data, { base64: true });
        });
        
        // 生成zip文件
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        // 下载zip文件
        const zipFileName = getZipFileName(currentPdfFile.name);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = zipFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('下载已开始', 'success');
    } catch (error) {
        console.error('批量下载出错:', error);
        showToast('批量下载失败', 'error');
    }
}

// 加载JSZip库
function loadJSZip() {
    return new Promise((resolve, reject) => {
        if (typeof JSZip !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('无法加载JSZip库'));
        document.head.appendChild(script);
    });
}

// 获取文件名
function getFileName(baseName, pageNumber, format) {
    // 移除扩展名
    const nameWithoutExt = baseName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}_page${pageNumber}.${format}`;
}

// 获取ZIP文件名
function getZipFileName(baseName) {
    // 移除扩展名
    const nameWithoutExt = baseName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}_images.zip`;
}

// 清除所有
function clearAll() {
    // 重置表单
    fileInput.value = '';
    
    // 重置预览和结果区域
    pdfPreview.innerHTML = '';
    pdfPreview.style.display = 'none';
    resultArea.innerHTML = '';
    
    // 隐藏选项和下载区域
    conversionOptions.style.display = 'none';
    downloadOptions.style.display = 'none';
    
    // 隐藏控制按钮区域
    document.querySelector('.controls').style.display = 'none';
    
    // 重置按钮状态
    convertBtn.disabled = true;
    clearBtn.disabled = true;
    
    // 恢复转换按钮显示和样式
    convertBtn.style.display = '';
    clearBtn.style.flex = '';
    
    // 重置变量
    currentPdfFile = null;
    pdfDocument = null;
    pdfPages = 0;
    convertedImages = [];
    
    showToast('已清除所有内容', 'info');
}

// 显示提示消息
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // 图标
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
    
    // 添加到容器
    toastContainer.appendChild(toast);
    
    // 显示Toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // 3秒后自动移除
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
} 