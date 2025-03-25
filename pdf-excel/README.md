# PDF表格转Excel网站

这是一个将PDF表格文件转换为可编辑Excel表格的Web应用程序。

## 功能特点

- 支持PDF文件上传
- 自动将PDF转换为图片
- 使用腾讯云OCR API进行表格识别
- 将识别结果转换为Excel文件
- 提供Excel文件下载

## 技术栈

- 前端：HTML/CSS/JavaScript + FilePond（文件上传组件）
- 后端：Python + Flask + 腾讯云OCR SDK
- 工具库：
  - PDF转图片：pdf2image + poppler
  - Excel生成：pandas
  - 图片处理：Pillow

## 使用方法

1. 启动后端服务器：`python app.py`
2. 在浏览器中访问：`http://localhost:5000`
3. 上传PDF文件
4. 等待处理完成后下载Excel文件