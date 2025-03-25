# VVChange - Office File Conversion Tools

A simple responsive website providing office file conversion services.

## Website Structure

- **Home (index.html)**: Website homepage, introducing VVChange and its main tools
- **Tools Section (#tools-section)**: Displays all available conversion tools
- **Image to PDF (img-pdf/index.html)**: Image to PDF conversion tool page
- **PDF to Image (pdf-img/index.html)**: PDF to Image conversion tool page
- **PDF to Excel (pdf-excel/)**: PDF to Excel conversion tool

## Technical Features

- Responsive design, compatible with PC and mobile devices
- Modern blue theme UI
- Clean and intuitive user interface

## Local Setup

Simply open index.html in a browser to view the website.

## File Structure

```
vvchange/
├── index.html          # Website homepage
├── #tools-section     # Tools conversion page
├── img-pdf/index.html # Image to PDF tool page
├── pdf-img/index.html # PDF to Image tool page
├── pdf-excel/         # PDF to Excel conversion tool
│   ├── app.py         # Backend for PDF to Excel
│   ├── templates/     # HTML templates
│   └── static/        # Static assets (CSS, JS)
├── styles.css         # Stylesheet
├── script.js         # JavaScript script
└── images/           # Icons and image resources
    ├── img-to-pdf.svg # Image to PDF icon
    ├── pdf-to-img.svg # PDF to Image icon
    └── pdf-to-excel.svg # PDF to Excel icon
``` 

## PDF to Excel Converter Setup

The PDF to Excel converter requires Python and several dependencies:

1. Install Python 3.7 or higher
2. Install the required packages:
   ```
   pip install flask pdf2image openpyxl tencentcloud-sdk-python uuid
   ```
3. Set up environment variables for Tencent Cloud OCR API:
   ```
   # Windows
   set TENCENT_SECRET_ID=your_secret_id_here
   set TENCENT_SECRET_KEY=your_secret_key_here
   
   # Linux/Mac
   export TENCENT_SECRET_ID=your_secret_id_here
   export TENCENT_SECRET_KEY=your_secret_key_here
   ```
4. Run the application:
   ```
   cd pdf-excel
   python app.py
   ```
5. Open your browser and go to http://localhost:5000 