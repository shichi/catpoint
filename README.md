# CatPoint

**Configurable and Interactive HTML Slide Presentation Application**

A highly versatile presentation tool that supports all types of HTML slides and provides rich interactive features.
Suitable for educational, business, and personal use across a wide range of applications.

[🇯🇵 日本語版 README](README_ja.md)

## Features

### Core Functionality
- 📁 **Automatic HTML Slide Detection** - Auto-recognition of HTML files in folders
- ✨ **Smooth Slide Transitions** - With dissolve effects
- 📱 **Responsive Design** - Automatic adaptation to screen sizes
- ⌨️ **Rich Keyboard Shortcuts**
- 🖥️ **Fullscreen Support**
- 📋 **Standalone Desktop App** - Electron-based

### Interactive Features
- 🔍 **Right-Click Zoom** - 2x magnification centered on mouse position
- 🎨 **Real-time Drawing** - Draw lines with mouse drag, auto-fade
- 🖱️ **Zoom Scrolling** - Navigate view area with mouse wheel
- 👀 **Custom Mouse Cursor** - Enhanced visibility with trail effects

### Customization
- ⚙️ **Configuration File Support** - Full customization via JSON settings
- 🎨 **Theme Settings** - Customize colors, sizes, and behaviors
- 📂 **Flexible File Structure** - Support for arbitrary slide arrangements

## Quick Start

### Prerequisites
- Node.js (v16 or higher recommended)
- npm or yarn

### Installation and Setup

1. **Project Setup**
```bash
# Install dependencies
npm install

# Check configuration file (edit if needed)
# Edit config.json for customization
```

2. **Prepare Slides**
```bash
# Create slides folder (example)
mkdir slides

# Place HTML slide files
# 01.html, 02.html, 03.html...
# Or refer to slides-example folder
```

3. **Launch Application**
```bash
# Run in development mode
npm run dev

# Run in production mode
npm start
```

## Build

### Build for All Platforms
```bash
npm run build
```

### Platform-Specific Builds
```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

Built files will be generated in the `dist/` folder.

## Controls

### Keyboard Shortcuts

**Slide Navigation**
- `→` / `Space`: Next slide
- `←`: Previous slide
- `Home`: First slide
- `End`: Last slide

**Display Controls**
- `F11` / `Ctrl+Cmd+F` (Mac): Toggle fullscreen
- `Escape`: Exit fullscreen
- `+` / `=`: Zoom in
- `-` / `_`: Zoom out
- `0`: Reset zoom

**Application Controls**
- `Ctrl+R` / `Cmd+R`: Reload
- `Ctrl+Q` / `Cmd+Q`: Quit application

### Mouse Controls

**Basic Operations**
- Navigation with control buttons at bottom of screen
- Fullscreen button for full screen display

**Interactive Features**
- **Right Click**: 2x zoom/zoom toggle (centered on mouse position)
- **Left Click + Drag**: Draw lines (auto-fade after 3 seconds)
- **Wheel (During Zoom)**: Vertical scrolling of view area
- **Custom Cursor**: Red cursor with trail visualization

## File Structure

```
Project Folder/
├── main.js              # Electron main process
├── preload.js           # Preload script
├── presentation.html    # Main application
├── config.json          # Configuration file (customizable)
├── package.json         # Project settings
├── slides/              # Slides folder (configurable)
│   ├── 01.html
│   ├── 02.html
│   └── ...
├── slides-example/      # Sample slides
└── dist/               # Build output folder
```

## Customization

### Configuration File (config.json)

```json
{
  "presentation": {
    "title": "My Presentation",
    "slideDirectory": "./slides",
    "autoDetectSlides": true,
    "totalSlides": null
  },
  "ui": {
    "theme": {
      "backgroundColor": "#0a192f",
      "primaryColor": "#3b82f6"
    },
    "cursor": {
      "enabled": true,
      "color": "#ff0000",
      "size": 20
    }
  },
  "zoom": {
    "enabled": true,
    "factor": 2,
    "maxZoom": 3,
    "scrollSensitivity": 30
  },
  "drawing": {
    "enabled": true,
    "lineColor": "#ff0000",
    "lineWidth": 3,
    "fadeTimeout": 3000
  }
}
```

### Creating Slides

**HTML Slide Template**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Slide Title</title>
    <style>
        .slide-container {
            width: 1280px;
            height: 720px;
            /* Your styles here */
        }
    </style>
</head>
<body>
    <div class="slide-container">
        <!-- Slide content -->
    </div>
</body>
</html>
```

**Automatic Slide Detection**
- Set `autoDetectSlides: true` to auto-detect 01.html~99.html
- Specify slide folder with `slideDirectory`
- Sequential file naming (01.html, 02.html...) is recommended

## Technical Specifications

### Core Technologies
- **Framework**: Electron (Cross-platform)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Rendering**: CSS Transform + Canvas API
- **Configuration**: JSON configuration files

### Supported Environments
- **OS**: Windows, macOS, Linux
- **Node.js**: v16 or higher
- **Browser**: Chromium (Electron embedded)
- **Slide Formats**: HTML, HTM

### Performance Optimizations
- Efficient resize handling with ResizeObserver
- Throttled mouse tracking
- Asynchronous slide loading
- Memory-efficient drawing management

## Troubleshooting

### Slides Not Displaying

**Causes and Solutions**
1. **Files Not Found**
   ```bash
   # Check slide file existence
   ls slides/  # or ls *.html
   ```

2. **Configuration File Issues**
   ```bash
   # Check config.json syntax
   node -e "console.log(JSON.parse(require('fs').readFileSync('config.json')))"
   ```

3. **Permission Errors**
   ```bash
   # Check file permissions
   chmod 644 *.html slides/*.html
   ```

### Drawing Feature Not Working

**Check Items**
- Ensure `"drawing.enabled": true` in config.json
- Check browser developer tools (F12) for errors
- Verify Canvas API support

### Performance Issues

**Optimization Methods**
- Optimize large image files (WebP format recommended)
- Disable unnecessary features in config.json
- Adjust slide count (recommended: under 50 slides)

### Installation Issues

```bash
# Complete dependency reinstallation
rm -rf node_modules package-lock.json
npm install

# Rebuild Electron
npm run rebuild
```

## Contributing

### Feature Requests & Bug Reports
Please create an issue to let us know.

### Development Participation
1. Create a fork
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Create pull request

## Use Cases

### Educational Institutions
- Classroom presentations
- Academic conference presentations
- Online lectures

### Business Applications
- Corporate presentations
- Product demonstrations
- Training materials

### Personal Use
- Portfolio showcases
- Photo slideshows
- Personal project presentations

## License

MIT License - See LICENSE file for details.