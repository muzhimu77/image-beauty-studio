<div align="center">

# Image Beauty Studio

**An AI-powered desktop image-processing toolkit — MediaPipe face landmarks, beauty filters, and classical CV operations**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![OpenCV](https://img.shields.io/badge/OpenCV-4.x-5C3EE8)
![MediaPipe](https://img.shields.io/badge/MediaPipe-FaceMesh-0F9D58)

</div>

---

## Overview

Image Beauty Studio is a desktop application that combines classical image-processing operations with a modern face-landmark AI pipeline. Built as a lead-developer course project, it runs MediaPipe FaceMesh landmarks locally and exposes a beauty-filter pipeline (skin smoothing, whitening, face reshaping) through a desktop UI, with no cloud dependency.

The AI / CV logic lives in a self-contained Python module, driven by either an Electron front-end or a Python-native UI, depending on the deployed configuration.

## Features

- **Face landmark detection** via Google MediaPipe FaceMesh (468 landmarks per face)
- **Beauty pipeline** built on top of landmark geometry — skin smoothing, whitening, face reshaping
- **Classical CV toolkit** — Gaussian / bilateral filtering, color-space conversion, morphology
- **Modular AI backend** — MediaPipe model code decoupled from the desktop UI, callable as a service
- **Cross-language glue** — Python CV pipeline driving a non-Python renderer, with explicit IPC

## Tech Stack

**Frontend**: Electron *or* Python-native UI  
**CV / AI**: Python 3.10+ · OpenCV 4.x · MediaPipe FaceMesh · NumPy  
**Interop**: HTTP / IPC bridge between Python CV backend and UI

## Architecture

```
┌─────────────────────────────────────────┐
│         Desktop UI                      │
│     (Electron or Python-native)         │
└──────────────────┬──────────────────────┘
                   │  IPC / HTTP
┌──────────────────▼──────────────────────┐
│        Python CV / AI Pipeline          │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │  MediaPipe  │  │   OpenCV ops     │  │
│  │  FaceMesh   │  │ filters, color,  │  │
│  │  (468 ldmk) │  │ morphology       │  │
│  └─────────────┘  └──────────────────┘  │
└─────────────────────────────────────────┘
```

## Quick Start

```bash
git clone https://github.com/muzhimu77/image-beauty-studio.git
cd image-beauty-studio

# Python CV / AI backend
pip install -r requirements.txt

# Frontend (Electron-based)
npm install
npm start

# Or: Python-native UI
python app.py
```

## Screenshots

> A 3-image strip saves a thousand words: raw input → landmark overlay → beauty output. Drop it into `docs/demo.png` and embed with `![](docs/demo.png)`.

## Repository Structure

> TODO: refine to match the actual layout

```
image-beauty-studio/
├── src/                  # main UI entry
├── pipeline/             # Python CV / MediaPipe pipeline
│   ├── facemesh.py
│   ├── beauty.py
│   └── filters.py
├── assets/               # sample images (avoid personal photos)
├── docs/                 # screenshots & demo
├── requirements.txt
└── README.md
```

## License

MIT — see [LICENSE](LICENSE).
