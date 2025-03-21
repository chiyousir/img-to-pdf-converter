# Image to PDF Converter

A simple and easy-to-use web tool for converting multiple images to PDF documents.

## Features

- Support drag and drop image upload
- Support selecting multiple images simultaneously
- Support drag and drop to reorder images
- Automatically resize images to fit PDF pages
- Each image on a separate page
- Automatically download generated PDF

## How to Use

1. Open index.html file
2. Upload images by clicking the "Select Files" button or dragging images to the designated area
3. After uploading, you can see image previews and:
   - Drag images to adjust order
   - Click the "×" button in the top right corner of images to delete unwanted ones
4. Click "Generate PDF" button to convert images to PDF and download automatically
5. Click "Clear All" button to remove all uploaded images at once

## Technical Details

This tool is implemented using pure frontend technologies, no server support required:

- HTML5 provides interface structure
- CSS3 provides styling and responsive design
- JavaScript provides interaction logic
- jsPDF library for generating PDF documents
- Sortable.js library for implementing drag and drop sorting

## Browser Compatibility

Supports all modern browsers, including:

- Chrome
- Firefox
- Edge
- Safari

## Notes

- Larger images may take longer to process
- Generated PDF quality depends on original image quality
- This tool runs locally and does not upload your images to any server 