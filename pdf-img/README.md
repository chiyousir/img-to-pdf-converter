# PDF to Image Tool

A simple yet powerful online tool to convert PDF files to high-quality images without the need to download any software.

## Features

- Support drag and drop PDF file upload
- Support multiple output formats (JPG/PNG)
- Support adjusting image quality and resolution
- Support selective conversion of specific pages
- Support batch download of converted images
- Responsive design, compatible with mobile and desktop devices
- All processing is done in the browser, no need to upload to a server
- No file size limit (depends on your browser performance)

## Usage

1. Drag and drop the PDF file into the upload area or click the "Select PDF File" button
2. Wait for the PDF preview to load
3. Set the desired image format, quality, and resolution
4. Choose whether to convert all pages or a specific range of pages
5. Click the "Convert to Image" button
6. View the conversion results and download the desired image

## Technical Implementation

- Use PDF.js to process PDF files
- Use Canvas API to render PDF pages as images
- Use JSZip to implement batch download functionality
- All processing is done in the client, no need to upload to a server

## Notes

- Large PDF files may take a long time to process
- High DPI settings may increase memory usage
- It's recommended to use a modern browser for the best experience

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Edge
- Safari

© 2025 vvChange - Smart Conversion Tools 