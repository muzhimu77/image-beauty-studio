const { ipcRenderer } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ========================= 1. 基础配置 =========================
const pythonPath = 'C:\\Users\\14412\\anaconda3\\envs\\num_env\\python.exe';
const pythonScriptPath = 'image_processor.py';

// ========================= 2. DOM元素获取（补充缺失的paramPanels + 新增目标功能元素） =========================
// 核心功能按钮
const openImgBtn = document.getElementById('open-img');
const saveImgBtn = document.getElementById('save-img');
const exitAppBtn = document.getElementById('exit-app');
// 图像预览元素
const originalImg = document.getElementById('original-img');
const processedImg = document.getElementById('processed-img');
const originalPlaceholder = document.getElementById('original-placeholder');
const processedPlaceholder = document.getElementById('processed-placeholder');
// 参数面板元素（补充paramPanels，用于隐藏所有面板）
const paramPanel = document.getElementById('param-panel');
const paramTitle = document.getElementById('param-title');
const funcBtns = document.querySelectorAll('.func-btn');
const paramPanels = document.querySelectorAll('.param-item'); // 关键补充：之前遗漏
// 基础功能 - 亮度
const brightnessSlider = document.getElementById('brightness-slider');
const brightnessValue = document.getElementById('brightness-value');
// 基础功能 - 对比度
const contrastSlider = document.getElementById('contrast-slider');
const contrastValue = document.getElementById('contrast-value');
// 基础功能 - 平滑（新增）
const smoothSlider = document.getElementById('smooth-slider');
const smoothValue = document.getElementById('smooth-value');
const smoothApplyBtn = document.getElementById('smooth-apply');
// 基础功能 - 锐化（新增）
const sharpenSlider = document.getElementById('sharpen-slider');
const sharpenValue = document.getElementById('sharpen-value');
const sharpenApplyBtn = document.getElementById('sharpen-apply');
// 基础功能 - 直方图均衡化（新增）
const histogramPanel = document.querySelector('.param-item[data-func="histogram"]');
const histogramSlider = document.getElementById('histogram-slider');
const histogramValue = document.getElementById('histogram-value');
const histogramApplyBtn = document.getElementById('histogram-apply'); // 新增：直方图应用按钮
// 基础功能 - 旋转（包含设为原图和重置按钮）
const rotateLeftBtn = document.getElementById('rotate-left');
const rotateRightBtn = document.getElementById('rotate-right');
const rotate180Btn = document.getElementById('rotate-180');
const rotateAngle = document.getElementById('rotate-angle');
const flipVerticalBtn = document.getElementById('flip-vertical');
const flipHorizontalBtn = document.getElementById('flip-horizontal');
const flipBothBtn = document.getElementById('flip-both');
const rotateSetOriginalBtn = document.getElementById('rotate-set-original');
const rotateResetBtn = document.getElementById('rotate-reset');
const rotateApplyBtn = document.getElementById('rotate-apply'); // 新增：旋转应用按钮
// 基础功能 - 曲线调整（完整DOM）
const curveCanvas = document.getElementById('curve-canvas');
const curveCtx = curveCanvas ? curveCanvas.getContext('2d') : null;
const curveResetBtn = document.getElementById('curve-reset');
const curveApplyBtn = document.getElementById('curve-apply');
const curveChannelSelect = document.getElementById('curve-channel');
const curvePresetSelect = document.getElementById('curve-preset');
const curveInput = document.getElementById('curve-input');
const curveOutput = document.getElementById('curve-output');
// 基础功能 - 饱和度
const saturationSlider = document.getElementById('saturation-slider');
const saturationValue = document.getElementById('saturation-value');
// 基础功能 - HSL
const hslChannelBtns = document.querySelectorAll('.hsl-channel-btn');
const hslHue = document.getElementById('hsl-hue');
const hslHueValue = document.getElementById('hsl-hue-value');
const hslSaturation = document.getElementById('hsl-saturation');
const hslSaturationValue = document.getElementById('hsl-saturation-value');
const hslLightness = document.getElementById('hsl-lightness');
const hslLightnessValue = document.getElementById('hsl-lightness-value');
const hslApplyBtn = document.getElementById('hsl-apply');
// 基础功能 - 色温
const tempSlider = document.getElementById('temp-slider');
const tempValue = document.getElementById('temp-value');
// 基础功能 - 色调
const tintSlider = document.getElementById('tint-slider');
const tintValue = document.getElementById('tint-value');
// 基础功能 - 光线调节（新增：光感、曝光）
const lightSenseSlider = document.getElementById('light-sense-slider');
const lightSenseValue = document.getElementById('light-sense-value');
const exposureSlider = document.getElementById('exposure-slider');
const exposureValue = document.getElementById('exposure-value');
const lightAdjustResetBtn = document.getElementById('light-adjust-reset');
const lightAdjustSetOriginalBtn = document.getElementById('light-adjust-set-original');
// 高级功能 - 去雾
const dehazeSlider = document.getElementById('dehaze-slider');
const dehazeValue = document.getElementById('dehaze-value');
const dehazeApplyBtn = document.getElementById('dehaze-apply'); // 新增：去雾应用按钮
// 高级功能 - 水印
const watermarkText = document.getElementById('watermark-text');
const watermarkOpacity = document.getElementById('watermark-opacity');
const watermarkOpacityValue = document.getElementById('watermark-opacity-value');
const watermarkApplyBtn = document.getElementById('watermark-apply'); // 新增：水印应用按钮
const watermarkFontSize = document.getElementById('watermark-font-size'); // 新增：水印字体大小
const watermarkFontSizeValue = document.getElementById('watermark-font-size-value'); // 新增：水印字体大小值显示
const watermarkTypeGlobal = document.getElementById('watermark-type-global'); // 新增：全局水印选项
const watermarkTypeCorner = document.getElementById('watermark-type-corner'); // 新增：右下角水印选项
// 高级功能 - 文字（新增）
const textContent = document.getElementById('text-content');
const textSize = document.getElementById('text-size');
const textOpacity = document.getElementById('text-opacity');
const textOpacityValue = document.getElementById('text-opacity-value');
const textPositionBtns = document.querySelectorAll('.text-position-btn'); // 保留原有
const textApplyBtn = document.getElementById('text-apply'); // 保留原有
//const createTextBoxBtn = document.getElementById('create-text-box'); // 可选：如需可解除注释
// 新增：文字功能 - 字体选择和颜色选择DOM元素
const textFontSelect = document.getElementById('text-font');
const textColorPicker = document.getElementById('text-color');
// 新增：右侧删除按钮
const deleteTextBtn = document.getElementById('delete-text-btn');
// 美颜功能 - 细分参数逻辑（修正ID+清理无效元素）
const beautySmooth = document.getElementById('beauty-smooth');
const beautySmoothValue = document.getElementById('beauty-smooth-value');
const beautyWhiten = document.getElementById('beauty-whiten');
const beautyWhitenValue = document.getElementById('beauty-whiten-value');
const beautyEyeEnlarge = document.getElementById('beauty-eye-enlarge');
const beautyEyeEnlargeValue = document.getElementById('beauty-eye-enlarge-value');
const beautySlimFace = document.getElementById('beauty-slim-face');
const beautySlimFaceValue = document.getElementById('beauty-slim-face-value');
const onekeyBeautyBtn = document.getElementById('onekey-beauty');
const beautySetOriginalBtn = document.getElementById('beauty-set-original');
const beautyResetBtn = document.getElementById('beauty-reset');
// 补充美颜基础元素（来自下方代码）
const beautySlider = document.getElementById('beauty-slider');
const beautyValue = document.getElementById('beauty-value');
const detectFaceBtn = document.getElementById('detect-face');
// 裁剪功能核心元素
const cropBox = document.getElementById('crop-box');
const cropHandles = document.querySelectorAll('.crop-handle');
const cropRatioBtns = document.querySelectorAll('.crop-ratio-btn');
const cropWidth = document.getElementById('crop-width');
const cropHeight = document.getElementById('crop-height');
const cropApplyBtn = document.getElementById('crop-apply');
// 缩放控制
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const zoomLevelDisplay = document.getElementById('zoom-level');
// 撤销/重做
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');

// ========================= 新增：文字输入框交互（确保焦点和输入正常） =========================
// 确保输入框可以正常获得焦点和输入
if (textContent) {
  textContent.addEventListener('click', (e) => {
    e.stopPropagation();
    textContent.disabled = false;
    textContent.readOnly = false;
  });
  textContent.addEventListener('focus', () => {
    textContent.disabled = false;
    textContent.readOnly = false;
  });
}

if (textSize) {
  textSize.addEventListener('click', (e) => {
    e.stopPropagation();
    textSize.disabled = false;
    textSize.readOnly = false;
  });
  textSize.addEventListener('focus', () => {
    textSize.disabled = false;
    textSize.readOnly = false;
  });
}

// ========================= 3. 全局变量（补充目标功能相关变量，不删除原有） =========================
let originalWidth = 0;
let originalHeight = 0;
let currentZoom = 100;
const minZoom = 25;
const maxZoom = 400;
let currentCropRatio = 'custom';
// 裁剪框状态
let isDragging = false;
let isResizing = false;
let resizeHandle = '';
let startX, startY, startLeft, startTop, startWidth, startHeight;
// 操作历史记录
let imageHistory = [null];
let historyIndex = 0;
// 新功能全局变量
let currentRotation = 0;
let current
Channel = 'all';
let isProcessing = false;

// -------------------------- 曲线相关全局变量（完整+必需） --------------------------
let currentChannel = 'rgb'; // 默认选中RGB复合通道
const channelColors = {
  rgb: '#000000',    // RGB复合通道：黑色曲线
  r: '#ef4444',      // 红通道：红色曲线
  g: '#22c55e',      // 绿通道：绿色曲线
  b: '#60a5fa'       // 蓝通道：蓝色曲线
};
// 初始曲线：RGB和单通道均为线性（对角线）
let curvePoints = {
  rgb: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
  r: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
  g: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
  b: [{ x: 0, y: 300 }, { x: 300, y: 0 }]
};
// 曲线预设（专业级，基准尺寸300px）
const presetCurves = {
  custom: {
    rgb: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
    r: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
    g: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
    b: [{ x: 0, y: 300 }, { x: 300, y: 0 }]
  },
  linear: {
    rgb: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
    r: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
    g: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
    b: [{ x: 0, y: 300 }, { x: 300, y: 0 }]
  },
  's-curve': {
    rgb: [
      { x: 0, y: 300 },
      { x: 60, y: 270 },
      { x: 150, y: 150 },
      { x: 240, y: 30 },
      { x: 300, y: 0 }
    ],
    r: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
    g: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
    b: [{ x: 0, y: 300 }, { x: 300, y: 0 }]
  },
  'lighten-shadows': {
    rgb: [{ x: 0, y: 150 }, { x: 100, y: 100 }, { x: 300, y: 0 }],
    r: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
    g: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
    b: [{ x: 0, y: 300 }, { x: 300, y: 0 }]
  },
  'darken-highlights': {
    rgb: [{ x: 0, y: 300 }, { x: 200, y: 250 }, { x: 300, y: 100 }],
    r: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
    g: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
    b: [{ x: 0, y: 300 }, { x: 300, y: 0 }]
  },
  'add-red': {
    rgb: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
    r: [{ x: 0, y: 300 }, { x: 150, y: 100 }, { x: 300, y: 0 }],
    g: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
    b: [{ x: 0, y: 300 }, { x: 300, y: 0 }]
  },
  'add-cyan': {
    rgb: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
    r: [{ x: 0, y: 300 }, { x: 150, y: 200 }, { x: 300, y: 0 }],
    g: [{ x: 0, y: 300 }, { x: 300, y: 0 }],
    b: [{ x: 0, y: 300 }, { x: 300, y: 0 }]
  }
};
// 曲线拖动必需状态（全局作用域，避免拖动失效）
let isDraggingCurve = false;
let activePoint = null;

// -------------------------- 新增：目标功能全局变量 --------------------------
// 文字功能全局变量-优化版（多文本框管理）
let textboxList = [];        // 文字框列表（管理多个文本框）
let isAddingText = false;    // 标记是否处于“添加文本”模式
let activeTextBox = null;    // 当前激活的文本框

// 局部编辑缓存：确保滑块效果基于当前图像（只限饱和度调整，HSL，锐化，平滑、色温、色调、文字，去雾，水印）
let saturationBaseImage = null; // 饱和度调整基准图
let tempBaseImage = null;       // 色温调整基准图
let tintBaseImage = null;       // 色调调整基准图
let sharpenBaseImage = null;    // 锐化调整基准图
let smoothBaseImage = null;     // 平滑调整基准图
let hslBaseImage = null;        // HSL调整基准图
let dehazeBaseImage = null;     // 去雾调整基准图
let watermarkBaseImage = null;  // 水印调整基准图
let textBaseImage = null;       // 文字添加基准图

// 存储右侧面板的编辑事件函数（用于后续解绑）
let textEditEvents = {
  fontChange: null,
  colorChange: null,
  sizeChange: null,
  opacityChange: null,
  contentChange: null
};

// 全局水印配置
let watermarkConfig = {
  text: '我的水印',
  opacity: 0.3,
  position: 'global', // 默认为全局水印（兼容新增的类型选择）
  font_size: 20,      // 字体大小（像素，默认20）
  color: [255, 255, 255], // 水印颜色（BGR格式，默认白色）
  type: 'global' // 'global' 全局水印, 'corner' 右下角水印
};

// -------------------------- 新增：辅助函数 --------------------------
function getActiveImageElement() {
  if (processedImg && processedImg.src && processedImg.src !== 'about:blank') {
    return processedImg;
  }
  return originalImg;
}

// ========================= 4. 核心功能：打开/保存/退出（IPC通信） =========================
// 打开图像
if (openImgBtn) {
  openImgBtn.addEventListener('click', () => {
    ipcRenderer.send('open-image-request');
  });
}

// 接收打开的图像路径
ipcRenderer.on('open-image-response', (event, imagePath) => {
  console.log('收到的图像路径：', imagePath);
  if (imagePath && originalImg && processedImg) {
    originalImg.src = imagePath;
    processedImg.src = imagePath;
    hidePlaceholders();
    resetZoom();

    // 图像加载完成后初始化依赖图像的功能
    originalImg.onload = function() {
      originalWidth = originalImg.naturalWidth;
      originalHeight = originalImg.naturalHeight;
      initCropBox(); 
      initCurveCanvas(); 
      //createTextBox(); // add删去 createTextBox();
    };

    // 初始化历史记录
    imageHistory = [imagePath];
    historyIndex = 0;
    currentRotation = 0;
    currentHslChannel = 'all';
  }
});

// 保存图像
if (saveImgBtn) {
  saveImgBtn.addEventListener('click', () => {
    if (!processedImg || !processedImg.src || processedImg.src === 'about:blank') {
      alert('请先打开图像并处理！');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = processedImg.naturalWidth;
      canvas.height = processedImg.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(processedImg, 0, 0, canvas.width, canvas.height);
	  // 第二步：遍历所有文字框，将文字绘制到 Canvas 对应位置
      if (textboxList && textboxList.length > 0) {
        // 获取图片容器的缩放比例（解决 Canvas 绘制坐标与 DOM 坐标的适配）
        const container = processedImg.parentElement;
        const containerRect = container.getBoundingClientRect();
        // 获取图像的实际显示尺寸（考虑缩放）
        const imgDisplayWidth = processedImg.clientWidth;
        const imgDisplayHeight = processedImg.clientHeight;
        // 计算从显示尺寸到实际图像尺寸的缩放比例
        const scaleX = canvas.width / imgDisplayWidth;
        const scaleY = canvas.height / imgDisplayHeight;

        textboxList.forEach(textBox => {
          // 从 dataset 中读取文字框的专属样式和内容
          const style = JSON.parse(textBox.dataset.style || '{}');
          const content = style.content || '';
          if (!content) return; // 空文字不绘制

          // 读取文字样式参数
          const fontSize = parseInt(style.fontSize) || 36;
          const fontFamily = style.fontFamily || textFontSelect.value || '黑体';
          const color = style.color || textColorPicker.value || '#000000';
          const opacity = style.opacity || (textOpacity.value / 100) || 1;
          
          // 获取文字框在 DOM 中的坐标，并转换为 Canvas 的实际坐标（适配缩放）
          const textBoxRect = textBox.getBoundingClientRect();
          const containerRect = processedImg.parentElement.getBoundingClientRect();
          // 计算文字框相对于图像显示区域的坐标
          const imgRect = processedImg.getBoundingClientRect();
          const relativeX = (textBoxRect.left - imgRect.left) * scaleX;
          // Canvas 文字的 y 坐标是基线，需加上缩放后的字体大小（适配 DOM 顶部坐标）
          const scaledFontSize = fontSize * scaleY;
          const relativeY = (textBoxRect.top - imgRect.top) * scaleY + scaledFontSize;

          // 设置 Canvas 绘制样式（字体大小需要按比例缩放）
          ctx.font = `${scaledFontSize}px ${fontFamily}`; // 字体大小 + 字体
          ctx.fillStyle = color; // 文字颜色
          ctx.globalAlpha = opacity; // 透明度
          ctx.textBaseline = 'bottom'; // 文字基线对齐方式（简化坐标适配）

          // 绘制文字到 Canvas
          ctx.fillText(content, relativeX, relativeY);
          
          // 重置透明度（避免影响后续绘制）
          ctx.globalAlpha = 1;
        });
      }
      const base64Data = canvas.toDataURL('image/jpeg', 0.9)
        .replace(/^data:image\/jpeg;base64,/, '');

      ipcRenderer.send('save-image-request', base64Data);
    } catch (err) {
      console.error('保存前处理失败:', err);
      alert('保存失败：图像处理异常');
    }
  });
}

// 接收保存结果
ipcRenderer.on('save-image-response', (event, isSuccess) => {
  alert(isSuccess ? '保存成功！' : '保存失败，请重试！');
});

// 退出应用
if (exitAppBtn) {
  exitAppBtn.addEventListener('click', () => {
    if (confirm('确定要退出吗？')) {
      ipcRenderer.send('exit-app-request');
    }
  });
}
// 全局函数：更新撤销/重做按钮的状态（根据历史记录索引）
function updateUndoRedoBtn() {
  if (undoBtn && redoBtn) {
    // 当历史索引是0时，撤销按钮禁用（没有更早的记录）
    undoBtn.disabled = historyIndex <= 0;
    // 当历史索引是最后一条时，重做按钮禁用（没有更晚的记录）
    redoBtn.disabled = historyIndex >= imageHistory.length - 1;
  }
}
// ========================= 全局统一函数：将处理后图像（右图）设为新原图（左图） =========================
/**
 * 全局统一设为原图函数
 * @param {Object} options - 可选配置（支持不同功能的状态重置）
 * @param {boolean} options.resetCrop - 是否重置裁剪框（默认true）
 * @param {boolean} options.resetRotation - 是否重置旋转角度（默认true）
 */
async function setProcessedAsOriginal(options = {}) {
  // 默认配置：重置裁剪框和旋转角度
  const { resetCrop = true, resetRotation = true } = options;

  // 1. 基础校验
  if (!originalImg || !originalImg.src) {
    alert('请先打开图像！');
    return false;
  }
  const isProcessedValid = processedImg && processedImg.src && 
    processedImg.src !== 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  if (!isProcessedValid) {
    alert('请先执行处理操作（裁剪/旋转/翻转等）生成处理结果！');
    return false;
  }

  try {
    // 2. 保存当前原图到历史记录（支持撤销）
    if (imageHistory[historyIndex] !== originalImg.src) {
      imageHistory.splice(historyIndex + 1); // 清除后续分支历史
      imageHistory.push(originalImg.src);
      historyIndex = imageHistory.length - 1;
      updateUndoRedoBtn(); // 更新撤销/重做按钮状态
    }

    // 3. 将右图（处理结果）设为新左图（原图）
    originalImg.src = processedImg.src;

    // 4. 等待新原图加载完成，确保尺寸/状态同步
    await new Promise((resolve) => {
      const onLoadComplete = () => {
        originalImg.removeEventListener('load', onLoadComplete);
        originalImg.removeEventListener('error', onLoadComplete);
        resolve();
      };
      originalImg.addEventListener('load', onLoadComplete);
      originalImg.addEventListener('error', onLoadComplete);
    });

    // 5. 校验新原图加载状态
    if (!originalImg.complete || originalImg.naturalWidth <= 0) {
      throw new Error('新原图加载失败');
    }

    // 6. 同步核心状态：更新原图尺寸
    originalWidth = originalImg.naturalWidth;
    originalHeight = originalImg.naturalHeight;

    // 7. 按需重置功能状态
    if (resetRotation && typeof currentRotation !== 'undefined') {
      currentRotation = 0; // 重置旋转角度
      if (rotateAngle) rotateAngle.value = 0; // 同步旋转输入框
    }
    if (resetCrop && typeof initCropBox === 'function') {
      initCropBox(); // 重新初始化裁剪框（适配新原图尺寸）
    }

    // 8. 同步右图显示：保持左右一致，隐藏占位提示
    processedImg.src = originalImg.src; // 右图和左图同步
    if (processedPlaceholder) {
      processedPlaceholder.style.display = 'none'; // 强制隐藏占位提示
    }

    alert('已将处理结果设为新原图，可继续编辑！');
    return true;
  } catch (err) {
    console.error('设为原图失败：', err);
    alert(`设为原图失败：${err.message || '未知错误'}`);
    return false;
  }
}
// ========================= 5. 图像处理功能实现 =========================
// 5.1 光线调节功能（整合对比度，保留所有原名字）
if (brightnessSlider && lightSenseSlider && exposureSlider && lightAdjustResetBtn && lightAdjustSetOriginalBtn && contrastSlider && contrastValue) {
  // 存储当前光线参数（新增contrast，保留原参数名）
  let currentLightParams = {
    brightness: 0,
    lightSense: 0,
    exposure: 0,
    contrast: 1.0 // 对比度初始值（对应滑块100）
  };

  // 核心：光线调节处理函数（原逻辑不变）
  async function processLightAdjust() {
    if (!originalImg.src || isProcessing) return;

    isProcessing = true;
    try {
      const latestSrc = getLatestProcessedSrc(); // 复用原有函数
      const result = await processImageWithPython('lightAdjust', currentLightParams, latestSrc);
    } catch (err) {
      alert(`光线调节失败：${err.message || '未知错误'}`);
    } finally {
      isProcessing = false;
    }
  }

  // 滑块实时响应：亮度（原逻辑不变）
  brightnessSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    currentLightParams.brightness = value;
    brightnessValue.textContent = `当前：${value}`;
    processLightAdjust();
  });

  // 滑块实时响应：光感（原逻辑不变）
  lightSenseSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    currentLightParams.lightSense = value;
    lightSenseValue.textContent = `当前：${value}`;
    processLightAdjust();
  });

  // 滑块实时响应：曝光（原逻辑不变）
  exposureSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    currentLightParams.exposure = value;
    exposureValue.textContent = `当前：${value}`;
    processLightAdjust();
  });

  // 新增：对比度滑块实时响应（保留原ID和参数逻辑）
  contrastSlider.addEventListener('input', (e) => {
    // 原逻辑：滑块0~200 → 0.0~2.0（除以100）
    const value = parseFloat((e.target.value / 100).toFixed(1));
    currentLightParams.contrast = value; // 新增参数，键名=contrast（原名字）
    contrastValue.textContent = `当前：${value}`; // 原显示逻辑不变
    processLightAdjust(); // 复用原有处理函数
  });

  // 重置功能（扩展对比度参数归零，原逻辑不变）
  lightAdjustResetBtn.addEventListener('click', () => {
    if (!originalImg || !originalImg.src) {
      alert('请先打开图像！');
      return;
    }

    // 右图恢复为左图（原图）状态（原逻辑不变）
    processedImg.src = originalImg.src;
    if (processedPlaceholder) {
      processedPlaceholder.style.display = 'none';
    }

    // 光线参数归零（新增对比度，保留原参数名）
    currentLightParams = { brightness: 0, lightSense: 0, exposure: 0, contrast: 1.0 };
    // 同步滑块值（新增contrastSlider，原滑块不变）
    brightnessSlider.value = 0;
    lightSenseSlider.value = 0;
    exposureSlider.value = 0;
    contrastSlider.value = 100; // 对比度默认值100（对应1.0）
    // 同步显示值（新增contrastValue，原显示不变）
    brightnessValue.textContent = '当前：0';
    lightSenseValue.textContent = '当前：0';
    exposureValue.textContent = '当前：0';
    contrastValue.textContent = '当前：1.0';

    alert('已重置：光线参数归零，右图恢复为原图状态！');
  });

  // 设为原图功能（扩展对比度参数归零，原逻辑不变）
  lightAdjustSetOriginalBtn.addEventListener('click', () => {
    // 调用全局统一函数（原逻辑不变）
    setProcessedAsOriginal({
      resetRotation: false,
      resetCrop: false
    });

    // 光线参数归零（新增对比度，保留原参数名）
    currentLightParams = { brightness: 0, lightSense: 0, exposure: 0, contrast: 1.0 };
    // 同步滑块值（新增contrastSlider）
    brightnessSlider.value = 0;
    lightSenseSlider.value = 0;
    exposureSlider.value = 0;
    contrastSlider.value = 100;
    // 同步显示值（新增contrastValue）
    brightnessValue.textContent = '当前：0';
    lightSenseValue.textContent = '当前：0';
    exposureValue.textContent = '当前：0';
    contrastValue.textContent = '当前：1.0';
  });
}

// 5.2.1 锐化调节
if (sharpenSlider && sharpenValue && sharpenApplyBtn) {
  sharpenSlider.addEventListener('input', (e) => {
    const strength = parseInt(e.target.value);
    sharpenValue.textContent = `当前：${strength}`;
  });

  sharpenApplyBtn.addEventListener('click', () => {
    const strength = parseInt(sharpenSlider.value) / 100;
    if (!originalImg || !originalImg.src) {
      alert('请先打开图像！');
      return;
    }
    processImageWithPython('sharpen', { strength });
  });
}

// 5.2.2 平滑调节
if (smoothSlider && smoothValue && smoothApplyBtn) {
  smoothSlider.addEventListener('input', (e) => {
    const strength = parseInt(e.target.value);
    smoothValue.textContent = `当前：${strength}`;
  });

  smoothApplyBtn.addEventListener('click', () => {
    const strength = parseInt(smoothSlider.value);
    let kernelSize = Math.round((strength / 100) * 20) + 1;
    if (kernelSize % 2 === 0) {
      kernelSize += 1;
    }
    kernelSize = Math.min(21, Math.max(1, kernelSize));

    if (!originalImg || !originalImg.src) {
      alert('请先打开图像！');
      return;
    }
    processImageWithPython('smooth', { kernel_size: kernelSize });
  });
}

// 5.2.3 文字功能（新增拖拽支持 + 实时预览+多文本框）addbyliuxiang
// 1. 点击"添加文本"按钮，进入文本绘制模式
const addTextBtn = document.getElementById('add-text-btn');
addTextBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  isAddingText = true;
  // 使用setTimeout确保按钮点击事件完成，避免焦点被按钮捕获
  setTimeout(() => {
  alert('请在图片区域点击以添加文本');
  }, 0);
});

// 2. 图片区域点击事件：创建可编辑文本框
const processedImgContainer = processedImg.parentElement;
processedImgContainer.addEventListener('click', (e) => {
  if (!isAddingText) return;
  
  // 如果点击的是已存在的文本框，不创建新文本框
  if (e.target.closest('.editable-textbox')) {
    return;
  }
  
  // 阻止事件冒泡，避免影响其他元素
  e.stopPropagation();

  const rect = processedImgContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  createEditableTextBox(x, y);
  isAddingText = false;
});

// 3. 动态创建可编辑文本框（核心逻辑，保留你的拖拽/删除/蓝框激活）
function createEditableTextBox(x, y) {
  const textBox = document.createElement('div');
  // 初始化专属样式：使用右侧面板的当前值，独立存储
  const initStyle = {
    fontFamily: textFontSelect.value,
    color: textColorPicker.value,
    fontSize: `${textSize.value}px`,
    opacity: textOpacity.value / 100,
    content: textContent.value || "请输入文字", // 独立初始内容
    x: x,
    y: y
  };
  textBox.dataset.style = JSON.stringify(initStyle);

  // 样式设置（保留你的原有逻辑）
  textBox.className = 'editable-textbox absolute';
  textBox.style.left = `${x}px`;
  textBox.style.top = `${y}px`;
  textBox.style.fontFamily = initStyle.fontFamily;
  textBox.style.color = initStyle.color;
  textBox.style.fontSize = initStyle.fontSize;
  textBox.style.opacity = initStyle.opacity;
  textBox.textContent = initStyle.content;
  textBox.style.border = '1px dashed #ccc'; // 初始灰色虚线

  // 新增删除按钮（保留你的原有逻辑）
  const deleteBtn = document.createElement('span');
  deleteBtn.className = 'text-delete-btn absolute -top-6 -right-6 text-red-500 cursor-pointer hidden';
  deleteBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
  deleteBtn.title = '删除文字';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    textBox.remove();
    textboxList = textboxList.filter(box => box !== textBox);
    if (activeTextBox === textBox) {
      activeTextBox = null;
      // 清空右侧面板
      clearTextPanel();
    }
  });
  textBox.appendChild(deleteBtn);

  // 鼠标hover显示删除按钮（保留你的原有逻辑）
  textBox.addEventListener('mouseenter', () => {
    deleteBtn.classList.remove('hidden');
  });
  textBox.addEventListener('mouseleave', () => {
    deleteBtn.classList.add('hidden');
  });

  // 拖拽移动逻辑（重新设计，避免与输入冲突）
  let isDraggingText = false;
  let startDragX, startDragY, startLeft, startTop;
  let hasMoved = false; // 标记是否发生了移动
  
  // 使用独立的mousemove处理函数，避免全局事件冲突
  const handleMouseMove = (e) => {
    if (!isDraggingText || !textBox.parentElement) {
      return;
    }
    const dx = e.clientX - startDragX;
    const dy = e.clientY - startDragY;
    // 如果移动距离超过5像素，认为是拖拽
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMoved = true;
      textBox.style.left = `${startLeft + dx}px`;
      textBox.style.top = `${startTop + dy}px`;
      const style = JSON.parse(textBox.dataset.style || '{}');
      style.x = startLeft + dx;
      style.y = startTop + dy;
      textBox.dataset.style = JSON.stringify(style);
    }
  };
  
  const handleMouseUp = () => {
    if (isDraggingText && !hasMoved) {
      // 如果没有移动，认为是点击事件，激活文本框
      activateTextBox(textBox);
    }
    isDraggingText = false;
    hasMoved = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  // 统一的mousedown事件处理
  textBox.addEventListener('mousedown', (e) => {
    // 如果点击的是删除按钮，不触发拖拽
    if (e.target.closest('.text-delete-btn')) {
      return;
    }
    if (e.button === 0) {
      hasMoved = false;
      isDraggingText = true;
      startDragX = e.clientX;
      startDragY = e.clientY;
      startLeft = parseInt(textBox.style.left) || 0;
      startTop = parseInt(textBox.style.top) || 0;
      e.stopPropagation();
      // 添加全局事件监听器
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  });

  // 点击文本框：激活并加载专属内容/样式到右侧面板
  function activateTextBox(textBox) {
    // 其他文本框恢复灰色虚线
    textboxList.forEach(box => {
      box.style.border = '1px dashed #ccc';
    });
    // 当前文本框高亮为蓝色虚线
    textBox.style.border = '1px dashed #0284c7';
    activeTextBox = textBox;
	
    // 从dataset读取该文本框的专属样式，覆盖右侧面板
    const style = JSON.parse(textBox.dataset.style || '{}');
    textFontSelect.value = style.fontFamily || '黑体';
    textColorPicker.value = style.color || '#000000';
    textSize.value = parseInt(style.fontSize) || 36;
    textOpacity.value = (style.opacity || 1) * 100;
    textOpacityValue.textContent = `当前：${Math.round((style.opacity || 1) * 100)}%`;
    textContent.value = style.content || ''; // 加载该文本框的独立内容

    // 确保输入框可编辑
    textContent.disabled = false;
    textContent.readOnly = false;
    textSize.disabled = false;
    textSize.readOnly = false;

    // 绑定右侧面板的编辑事件到当前激活的文本框
    bindTextEditEventsToActiveBox();

    // 延迟聚焦，确保DOM更新完成
    setTimeout(() => {
      if (textContent) {
        textContent.focus();
        textContent.select();
      }
    }, 50);
  }

  // 添加到容器和列表
  processedImgContainer.appendChild(textBox);
  textboxList.push(textBox);
  // 首次创建时激活该文本框
  setTimeout(() => {
    activateTextBox(textBox);
  }, 50);
}

// 核心函数：为右侧面板绑定仅作用于当前激活文本框的事件
function bindTextEditEventsToActiveBox() {
  if (!activeTextBox) return;

  // 第一步：先移除旧的事件监听（避免重复绑定）
  if (textEditEvents.fontChange) {
    textFontSelect.removeEventListener('change', textEditEvents.fontChange);
  }
  if (textEditEvents.colorChange) {
    textColorPicker.removeEventListener('input', textEditEvents.colorChange);
  }
  if (textEditEvents.sizeChange) {
    textSize.removeEventListener('input', textEditEvents.sizeChange);
  }
  if (textEditEvents.opacityChange) {
    textOpacity.removeEventListener('input', textEditEvents.opacityChange);
  }
  if (textEditEvents.contentChange) {
    textContent.removeEventListener('input', textEditEvents.contentChange);
  }

  // 第二步：定义新的事件函数，仅修改当前激活的文本框
  // 1. 字体修改
  textEditEvents.fontChange = function () {
    const style = JSON.parse(activeTextBox.dataset.style);
    style.fontFamily = textFontSelect.value;
    activeTextBox.style.fontFamily = style.fontFamily;
    activeTextBox.dataset.style = JSON.stringify(style);
  };
  // 2. 颜色修改
  textEditEvents.colorChange = function () {
    const style = JSON.parse(activeTextBox.dataset.style);
    style.color = textColorPicker.value;
    activeTextBox.style.color = style.color;
    activeTextBox.dataset.style = JSON.stringify(style);
  };
  // 3. 字号修改
  textEditEvents.sizeChange = function () {
    const style = JSON.parse(activeTextBox.dataset.style);
    style.fontSize = `${textSize.value}px`;
    activeTextBox.style.fontSize = style.fontSize;
    activeTextBox.dataset.style = JSON.stringify(style);
  };
  // 4. 透明度修改
  textEditEvents.opacityChange = function () {
    const opacity = textOpacity.value / 100;
    textOpacityValue.textContent = `当前：${textOpacity.value}%`;
    const style = JSON.parse(activeTextBox.dataset.style);
    style.opacity = opacity;
    activeTextBox.style.opacity = opacity;
    activeTextBox.dataset.style = JSON.stringify(style);
  };
  // 5. 文字内容修改（核心：仅更新激活的文本框内容）
  textEditEvents.contentChange = function () {
    const style = JSON.parse(activeTextBox.dataset.style);
    style.content = textContent.value; // 仅修改当前激活文本框的内容
    activeTextBox.textContent = style.content; // 更新DOM显示
    activeTextBox.dataset.style = JSON.stringify(style); // 持久化到dataset
  };

  // 第三步：绑定新的事件函数到右侧面板
  textFontSelect.addEventListener('change', textEditEvents.fontChange);
  textColorPicker.addEventListener('input', textEditEvents.colorChange);
  textSize.addEventListener('input', textEditEvents.sizeChange);
  textOpacity.addEventListener('input', textEditEvents.opacityChange);
  textContent.addEventListener('input', textEditEvents.contentChange);
  
  // 延迟聚焦输入框，确保事件绑定完成
  setTimeout(() => {
    if (textContent && activeTextBox) {
      textContent.disabled = false;
      textContent.readOnly = false;
      if (document.activeElement !== textContent) {
        textContent.focus();
      }
    }
  }, 50);
}

// 辅助函数：清空右侧面板（当删除激活的文本框时）
function clearTextPanel() {
  textContent.value = "";
  textSize.value = 36; // 恢复默认值
  textOpacity.value = 100;
  textOpacityValue.textContent = "当前：100%";
  textFontSelect.value = "黑体";
  textColorPicker.value = "#000000";
  // 移除所有事件监听
  if (textEditEvents.fontChange) textFontSelect.removeEventListener('change', textEditEvents.fontChange);
  if (textEditEvents.colorChange) textColorPicker.removeEventListener('input', textEditEvents.colorChange);
  if (textEditEvents.sizeChange) textSize.removeEventListener('input', textEditEvents.sizeChange);
  if (textEditEvents.opacityChange) textOpacity.removeEventListener('input', textEditEvents.opacityChange);
  if (textEditEvents.contentChange) textContent.removeEventListener('input', textEditEvents.contentChange);
  // 重置事件存储
  textEditEvents = {
    fontChange: null,
    colorChange: null,
    sizeChange: null,
    opacityChange: null,
    contentChange: null
  };
}

// 右侧删除按钮逻辑（保留你的原有逻辑，新增清空面板）
deleteTextBtn.addEventListener('click', () => {
  if (!activeTextBox) {
    alert('请先点击文本框选中要删除的文字');
    return;
  }
  activeTextBox.remove();
  textboxList = textboxList.filter(box => box !== activeTextBox);
  clearTextPanel(); // 清空右侧面板
  activeTextBox = null;
});

// 辅助函数：十六进制转RGB（保留你的原有逻辑，用于后续Python渲染）
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

// 5.3 直方图均衡化（完全参考对比度，确保语法无错）
if (histogramSlider && histogramValue && histogramPanel) {
  // 功能按钮点击
  funcBtns.forEach(btn => {
    if (btn.dataset.func === 'histogram') {
      btn.addEventListener('click', () => {
        if (!originalImg || !originalImg.src) {
          alert('请先打开图像！');
          return;
        }
        // 隐藏其他面板，显示当前面板
        document.querySelectorAll('.param-item').forEach(panel => {
          panel.classList.add('hidden');
        });
        histogramPanel.classList.remove('hidden');
        // 初始化数值
        const currentStrength = parseInt(histogramSlider.value) || 50;
        histogramValue.textContent = `当前：${currentStrength}`;
      });
    }
  });

  // 滑块拖动更新数值
  histogramSlider.addEventListener('input', (e) => {
    const strength = parseInt(e.target.value);
    histogramValue.textContent = `当前：${strength}`;
  });

  // 滑块松开触发处理
  histogramSlider.addEventListener('change', (e) => {
    const strength = parseInt(e.target.value);
    if (!originalImg || !originalImg.src) {
      alert('请先打开图像！');
      return;
    }
    processImageWithPython('histogramEqualize', { strength });
  });
}
// 5.4 去雾调节
if (dehazeSlider && dehazeValue && dehazeApplyBtn) {
  dehazeSlider.addEventListener('input', (e) => {
    const strength = parseInt(e.target.value);
    dehazeValue.textContent = `当前：${strength}`;
  });

  dehazeApplyBtn.addEventListener('click', () => {
    const strength = parseInt(dehazeSlider.value);
    if (!originalImg || !originalImg.src) {
      alert('请先打开图像！');
      return;
    }
    processImageWithPython('dehaze', { strength });
  });
}

// 5.5 水印功能add_by_刘翔
if (watermarkText && watermarkOpacity && watermarkApplyBtn) {
  // 水印类型选择
  if (watermarkTypeGlobal && watermarkTypeCorner) {
    // 默认选择全局水印
    watermarkConfig.type = 'global';
    
    watermarkTypeGlobal.addEventListener('click', () => {
      watermarkConfig.type = 'global';
      watermarkTypeGlobal.classList.add('bg-blue-500', 'text-white');
      watermarkTypeGlobal.classList.remove('bg-white', 'text-gray-700');
      watermarkTypeCorner.classList.remove('bg-blue-500', 'text-white');
      watermarkTypeCorner.classList.add('bg-white', 'text-gray-700');
    });
    
    watermarkTypeCorner.addEventListener('click', () => {
      watermarkConfig.type = 'corner';
      watermarkTypeCorner.classList.add('bg-blue-500', 'text-white');
      watermarkTypeCorner.classList.remove('bg-white', 'text-gray-700');
      watermarkTypeGlobal.classList.remove('bg-blue-500', 'text-white');
      watermarkTypeGlobal.classList.add('bg-white', 'text-gray-700');
    });
  }

  // 透明度调节
  watermarkOpacity.addEventListener('input', (e) => {
    const opacity = parseInt(e.target.value);
    watermarkOpacityValue.textContent = `当前：${opacity}%`;
    watermarkConfig.opacity = parseFloat((opacity / 100).toFixed(2));
  });

  // 水印文本输入
  watermarkText.addEventListener('input', (e) => {
    watermarkConfig.text = e.target.value || '我的水印';
  });
  
  // 字体大小调节逻辑
  watermarkFontSize.addEventListener('input', (e) => {
    const fontSize = parseInt(e.target.value);
    watermarkFontSizeValue.textContent = `当前：${fontSize}px`;
    watermarkConfig.font_size = fontSize; // 同步到全局配置
  });
  
  // 应用水印（点击后调用Python渲染）
  watermarkApplyBtn.addEventListener('click', () => {
    if (!originalImg || !originalImg.src) {
      alert('请先打开图像！');
      return;
    }
    // 根据水印类型设置不同的参数
    const config = { ...watermarkConfig };
    if (config.type === 'global') {
      // 全局水印：平铺整个图像
      config.position = 'global';
    } else if (config.type === 'corner') {
      // 右下角水印：计算右下角位置（相对于图像尺寸的百分比）
      config.position = 'corner'; // Python端会根据这个值计算右下角位置
    }
    processImageWithPython('watermark', config);
  });
}

// 确保processImageWithPython调用后更新历史记录
function processImageWithPython(funcName, param) {
  if (!originalImg || !originalImg.src) return;

  try {
    const baseSrc = (processedImg && processedImg.src && processedImg.src !== 'about:blank')
      ? processedImg.src
      : originalImg.src;
    const inputImgSrc = baseSrc;
    saveImageToTemp(inputImgSrc).then(inputTempPath => {
      const outputTempPath = path.join(os.tmpdir(), `output_${Date.now()}.jpg`);
      
      const pythonProcess = spawn(pythonPath, [
        pythonScriptPath,
        '--func', funcName,
        '--param', JSON.stringify(param),
        '--input', inputTempPath,
        '--output', outputTempPath
      ]);

      pythonProcess.stderr.on('data', (data) => {
        console.error('Python错误：', data.toString());
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          fs.readFile(outputTempPath, (err, data) => {
            if (err) {
              console.error('读取输出文件失败：', err);
              alert('处理后图像读取失败！');
              return;
            }
            const processedImgSrc = `data:image/jpeg;base64,${Buffer.from(data).toString('base64')}`;
            processedImg.src = processedImgSrc;
            // 关键：将渲染后的图存入历史记录，确保保存时调用最新图
            addToHistory(processedImgSrc); 
            fs.unlink(inputTempPath, () => {});
            fs.unlink(outputTempPath, () => {});
          });
        } else {
          console.error(`Python脚本退出码：${code}`);
          alert(`[${funcName}]功能处理失败！\nPython脚本退出码：${code}`);
          fs.unlink(inputTempPath, () => {});
          if (fs.existsSync(outputTempPath)) {
            fs.unlink(outputTempPath, () => {});
          }
        }
      });

      pythonProcess.on('error', (err) => {
        console.error('Python调用失败:', err);
        alert(`处理失败！\nPython调用错误：${err.message}`);
        fs.unlink(inputTempPath, () => {});
        if (fs.existsSync(outputTempPath)) {
          fs.unlink(outputTempPath, () => {});
        }
      });
    }).catch(err => {
      console.error('保存临时文件失败：', err);
      alert(`临时文件保存失败！\n${err.message}`);
    });
  } catch (err) {
    console.error('图像处理异常:', err);
    alert(`处理异常，请重试！\n${err.message}`);
  }
}
// 5.6 美颜功能（最终优化版）- 修复「设为原图滑块归零+重置功能」
if (
  beautySmooth && beautySmoothValue &&
  beautyWhiten && beautyWhitenValue &&
  beautyEyeEnlarge && beautyEyeEnlargeValue &&
  beautySlimFace && beautySlimFaceValue &&
  onekeyBeautyBtn && beautySetOriginalBtn &&
  beautyResetBtn // 新增：判断重置按钮存在（关键！）
) {
  // 1. 滑块拖动实时更新数值
  beautySmooth.addEventListener('input', (e) => {
    beautySmoothValue.textContent = `当前：${e.target.value}`;
  });
  beautyWhiten.addEventListener('input', (e) => {
    beautyWhitenValue.textContent = `当前：${e.target.value}`;
  });
  beautyEyeEnlarge.addEventListener('input', (e) => {
    beautyEyeEnlargeValue.textContent = `当前：${e.target.value}`;
  });
  beautySlimFace.addEventListener('input', (e) => {
    beautySlimFaceValue.textContent = `当前：${e.target.value}`;
  });

  // 2. 滑块松开后自动应用美颜
  function applyBeauty() {
    if (!originalImg || !originalImg.src) {
      alert('请先打开图像！');
      return;
    }
    const beautyParams = {
      smooth: parseInt(beautySmooth.value),
      whiten: parseInt(beautyWhiten.value),
      skinTone: parseInt(beautyEyeEnlarge.value),
      slimFace: parseInt(beautySlimFace.value),
    };
    processImageWithPython('beauty', beautyParams);
  }

  // 绑定所有滑块的change事件
  beautySmooth.addEventListener('change', applyBeauty);
  beautyWhiten.addEventListener('change', applyBeauty);
  beautyEyeEnlarge.addEventListener('change', applyBeauty);
  beautySlimFace.addEventListener('change', applyBeauty);

  // 3. 一键美颜
  onekeyBeautyBtn.addEventListener('click', () => {
    if (!originalImg || !originalImg.src) {
      alert('请先打开图像！');
      return;
    }
    const naturalParams = {
      smooth: 45,
      whiten: 35,
      skinTone: 25,
      slimFace: 30,
    };
    beautySmooth.value = naturalParams.smooth;
    beautySmoothValue.textContent = `当前：${naturalParams.smooth}`;
    beautyWhiten.value = naturalParams.whiten;
    beautyWhitenValue.textContent = `当前：${naturalParams.whiten}`;
    beautyEyeEnlarge.value = naturalParams.skinTone;
    beautyEyeEnlargeValue.textContent = `当前：${naturalParams.skinTone}`;
    beautySlimFace.value = naturalParams.slimFace;
    beautySlimFaceValue.textContent = `当前：${naturalParams.slimFace}`;
    processImageWithPython('beauty', naturalParams);
  });

  // 4. 设为原图（修复：滑块归零）
  beautySetOriginalBtn.addEventListener('click', () => {
    if (!originalImg || !originalImg.src || !processedImg || !processedImg.src) {
      alert('请先打开图像并完成美颜编辑！');
      return;
    }

    // 核心：调用全局统一函数（右图→左图）
    setProcessedAsOriginal({
      resetRotation: false,
      resetCrop: false
    });

    // 修复：滑块归零（删除之前的“保留参数”逻辑，替换为归零）
    beautySmooth.value = 0;
    beautyWhiten.value = 0;
    beautyEyeEnlarge.value = 0;
    beautySlimFace.value = 0;
    // 同步显示文本
    beautySmoothValue.textContent = '当前：0';
    beautyWhitenValue.textContent = '当前：0';
    beautyEyeEnlargeValue.textContent = '当前：0';
    beautySlimFaceValue.textContent = '当前：0';
  });

  // 5. 新增：重置功能（关键！之前缺失的逻辑）
  beautyResetBtn.addEventListener('click', () => {
    if (!originalImg || !originalImg.src) {
      alert('请先打开图像！');
      return;
    }

    // 逻辑1：滑块归零
    beautySmooth.value = 0;
    beautyWhiten.value = 0;
    beautyEyeEnlarge.value = 0;
    beautySlimFace.value = 0;
    // 同步显示文本
    beautySmoothValue.textContent = '当前：0';
    beautyWhitenValue.textContent = '当前：0';
    beautyEyeEnlargeValue.textContent = '当前：0';
    beautySlimFaceValue.textContent = '当前：0';

    // 逻辑2：右图恢复为左图（放弃当前美颜效果）
    processedImg.src = originalImg.src;
    if (processedPlaceholder) {
      processedPlaceholder.style.display = 'none';
    }

    alert('美颜已重置：参数归零，效果恢复原图！');
  });
}

// 5.7 裁剪功能
function initCropBox() {
  if (!cropBox || !originalImg) return;

  const container = originalImg.parentElement;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const boxWidth = Math.min(Math.round(containerWidth * 0.8), originalWidth);
  const boxHeight = Math.min(Math.round(containerHeight * 0.8), originalHeight);
  const boxLeft = Math.round((containerWidth - boxWidth) / 2);
  const boxTop = Math.round((containerHeight - boxHeight) / 2);

  cropBox.style.left = `${boxLeft}px`;
  cropBox.style.top = `${boxTop}px`;
  cropBox.style.width = `${boxWidth}px`;
  cropBox.style.height = `${boxHeight}px`;

  const scaleX = originalImg.naturalWidth / originalImg.clientWidth;
  const scaleY = originalImg.naturalHeight / originalImg.clientHeight;
  cropWidth.value = Math.round(boxWidth / (currentZoom / 100) * scaleX);
  cropHeight.value = Math.round(boxHeight / (currentZoom / 100) * scaleY);
}

if (cropBox) {
  cropBox.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('crop-handle')) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseInt(cropBox.style.left) || 0;
    startTop = parseInt(cropBox.style.top) || 0;

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
  });
}

function onDragMove(e) {
  if (!isDragging || !cropBox || !originalImg) return;
  const container = originalImg.parentElement;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;

  let newLeft = startLeft + dx;
  let newTop = startTop + dy;
  newLeft = Math.max(0, Math.min(newLeft, container.clientWidth - parseInt(cropBox.style.width)));
  newTop = Math.max(0, Math.min(newTop, container.clientHeight - parseInt(cropBox.style.height)));

  cropBox.style.left = `${newLeft}px`;
  cropBox.style.top = `${newTop}px`;
}

function onDragEnd() {
  isDragging = false;
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
}

cropHandles.forEach(handle => {
  handle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    isResizing = true;
    resizeHandle = handle.classList[1];
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseInt(cropBox.style.left) || 0;
    startTop = parseInt(cropBox.style.top) || 0;
    startWidth = parseInt(cropBox.style.width) || 0;
    startHeight = parseInt(cropBox.style.height) || 0;

    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
  });
});

function onResizeMove(e) {
  if (!isResizing || !cropBox || !originalImg) return;
  const container = originalImg.parentElement;
  let newLeft = startLeft;
  let newTop = startTop;
  let newWidth = startWidth;
  let newHeight = startHeight;

  switch (resizeHandle) {
    case 'top-left':
      newWidth = startWidth - (e.clientX - startX);
      newHeight = startHeight - (e.clientY - startY);
      newLeft = startLeft + (e.clientX - startX);
      newTop = startTop + (e.clientY - startY);
      break;
    case 'top-middle':
      newHeight = startHeight - (e.clientY - startY);
      newTop = startTop + (e.clientY - startY);
      break;
    case 'top-right':
      newWidth = startWidth + (e.clientX - startX);
      newHeight = startHeight - (e.clientY - startY);
      newTop = startTop + (e.clientY - startY);
      break;
    case 'middle-left':
      newWidth = startWidth - (e.clientX - startX);
      newLeft = startLeft + (e.clientX - startX);
      break;
    case 'middle-right':
      newWidth = startWidth + (e.clientX - startX);
      break;
    case 'bottom-left':
      newWidth = startWidth - (e.clientX - startX);
      newHeight = startHeight + (e.clientY - startY);
      newLeft = startLeft + (e.clientX - startX);
      break;
    case 'bottom-middle':
      newHeight = startHeight + (e.clientY - startY);
      break;
    case 'bottom-right':
      newWidth = startWidth + (e.clientX - startX);
      newHeight = startHeight + (e.clientY - startY);
      break;
  }

  newWidth = Math.max(50, Math.min(newWidth, container.clientWidth - newLeft));
  newHeight = Math.max(50, Math.min(newHeight, container.clientHeight - newTop));
  newLeft = Math.max(0, Math.min(newLeft, container.clientWidth - newWidth));
  newTop = Math.max(0, Math.min(newTop, container.clientHeight - newHeight));

  if (currentCropRatio !== 'custom') {
    const [wRatio, hRatio] = currentCropRatio.split(':').map(Number);
    if (['top-left', 'middle-left', 'bottom-left', 'top-right', 'middle-right', 'bottom-right'].includes(resizeHandle)) {
      newHeight = Math.round(newWidth * hRatio / wRatio);
    } else {
      newWidth = Math.round(newHeight * wRatio / hRatio);
    }
  }

  cropBox.style.left = `${newLeft}px`;
  cropBox.style.top = `${newTop}px`;
  cropBox.style.width = `${newWidth}px`;
  cropBox.style.height = `${newHeight}px`;

  const scaleX = originalImg.naturalWidth / originalImg.clientWidth;
  const scaleY = originalImg.naturalHeight / originalImg.clientHeight;
  const realWidth = Math.round(newWidth / (currentZoom / 100) * scaleX);
  const realHeight = Math.round(newHeight / (currentZoom / 100) * scaleY);
  cropWidth.value = realWidth;
  cropHeight.value = realHeight;
}

function onResizeEnd() {
  isResizing = false;
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);
}

cropRatioBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (originalWidth === 0 || originalHeight === 0) {
      alert('请先打开图像！');
      return;
    }

    currentCropRatio = btn.dataset.ratio;
    cropRatioBtns.forEach(b => b.classList.remove('bg-blue-500', 'text-white'));
    btn.classList.add('bg-blue-500', 'text-white');

    let targetW, targetH;
    switch (currentCropRatio) {
      case 'square':
        targetW = Math.min(originalWidth, originalHeight);
        targetH = targetW;
        break;
      case '4:3':
        targetW = originalWidth;
        targetH = Math.round(targetW * 3 / 4);
        if (targetH > originalHeight) {
          targetH = originalHeight;
          targetW = Math.round(targetH * 4 / 3);
        }
        break;
      case '16:9':
        targetW = originalWidth;
        targetH = Math.round(targetW * 9 / 16);
        if (targetH > originalHeight) {
          targetH = originalHeight;
          targetW = Math.round(targetH * 16 / 9);
        }
        break;
      case '3:4':
        targetW = originalWidth;
        targetH = Math.round(targetW * 4 / 3);
        if (targetH > originalHeight) {
          targetH = originalHeight;
          targetW = Math.round(targetH * 3 / 4);
        }
        break;
      case '9:16':
        targetW = originalWidth;
        targetH = Math.round(targetW * 16 / 9);
        if (targetH > originalHeight) {
          targetH = originalHeight;
          targetW = Math.round(targetH * 9 / 16);
        }
        break;
      case 'custom':
        return;
    }

    cropWidth.value = targetW;
    cropHeight.value = targetH;
    const scaleX = originalImg.clientWidth / originalImg.naturalWidth;
    const scaleY = originalImg.clientHeight / originalImg.naturalHeight;
    const boxWidth = Math.round(targetW * scaleX * (currentZoom / 100));
    const boxHeight = Math.round(targetH * scaleY * (currentZoom / 100));
    const container = originalImg.parentElement;
    const boxLeft = Math.round((container.clientWidth - boxWidth) / 2);
    const boxTop = Math.round((container.clientHeight - boxHeight) / 2);
    cropBox.style.left = `${boxLeft}px`;
    cropBox.style.top = `${boxTop}px`;
    cropBox.style.width = `${boxWidth}px`;
    cropBox.style.height = `${boxHeight}px`;
  });
});

cropWidth.addEventListener('input', () => {
  if (currentCropRatio === 'custom' || !cropWidth.value) return;
  const inputW = Math.min(parseInt(cropWidth.value), originalWidth);
  const [wRatio, hRatio] = currentCropRatio.split(':').map(Number);
  cropHeight.value = Math.min(Math.round(inputW * hRatio / wRatio), originalHeight);
  updateCropBoxFromInput();
});

cropHeight.addEventListener('input', () => {
  if (currentCropRatio === 'custom' || !cropHeight.value) return;
  const inputH = Math.min(parseInt(cropHeight.value), originalHeight);
  const [wRatio, hRatio] = currentCropRatio.split(':').map(Number);
  cropWidth.value = Math.min(Math.round(inputH * wRatio / hRatio), originalWidth);
  updateCropBoxFromInput();
});

function updateCropBoxFromInput() {
  if (!cropBox || !originalImg) return;
  const realW = parseInt(cropWidth.value) || 0;
  const realH = parseInt(cropHeight.value) || 0;
  const scaleX = originalImg.clientWidth / originalImg.naturalWidth;
  const scaleY = originalImg.clientHeight / originalImg.naturalHeight;
  const boxWidth = Math.round(realW * scaleX * (currentZoom / 100));
  const boxHeight = Math.round(realH * scaleY * (currentZoom / 100));
  const container = originalImg.parentElement;
  const boxLeft = Math.round((container.clientWidth - boxWidth) / 2);
  const boxTop = Math.round((container.clientHeight - boxHeight) / 2);
  const finalLeft = Math.max(0, Math.min(boxLeft, container.clientWidth - boxWidth));
  const finalTop = Math.max(0, Math.min(boxTop, container.clientHeight - boxHeight));
  cropBox.style.left = `${finalLeft}px`;
  cropBox.style.top = `${finalTop}px`;
  cropBox.style.width = `${boxWidth}px`;
  cropBox.style.height = `${boxHeight}px`;
}

cropApplyBtn.addEventListener('click', () => {
  if (!originalImg || !originalImg.src) {
    alert('请先打开图像！');
    return;
  }

  const container = originalImg.parentElement;
  const boxLeft = parseInt(cropBox.style.left) || 0;
  const boxTop = parseInt(cropBox.style.top) || 0;
  const boxWidth = parseInt(cropBox.style.width) || 0;
  const boxHeight = parseInt(cropBox.style.height) || 0;

  const scaleX = originalImg.naturalWidth / originalImg.clientWidth;
  const scaleY = originalImg.naturalHeight / originalImg.clientHeight;
  const zoomScale = currentZoom / 100;
const scale = originalImg.naturalWidth / originalImg.clientWidth; // 只取宽度比例（假设等比例缩放）
const realX = Math.floor(boxLeft / (currentZoom / 100) * scale);
const realY = Math.floor(boxTop / (currentZoom / 100) * scale);
const realW = Math.floor(boxWidth / (currentZoom / 100) * scale);
const realH = Math.floor(boxHeight / (currentZoom / 100) * scale);

  const finalX = Math.max(0, Math.min(realX, originalWidth - realW));
  const finalY = Math.max(0, Math.min(realY, originalHeight - realH));
  const finalW = Math.min(realW, originalWidth - finalX);
  const finalH = Math.min(realH, originalHeight - finalY);

  processImageWithPython('crop', { x: finalX, y: finalY, width: finalW, height: finalH });
});

// 裁剪功能 - 「设为原图」按钮（修改后：统一调用全局函数）
const cropSyncBtn = document.getElementById('crop-sync');
if (cropSyncBtn) { // 增加按钮存在性判断，避免报错
  cropSyncBtn.addEventListener('click', () => {
    // 配置：裁剪设为原图需重置裁剪框，不重置旋转角度（按需配置）
    setProcessedAsOriginal({ 
      resetCrop: true,    // 重新初始化裁剪框（适配新原图尺寸）
      resetRotation: false // 不改变旋转状态（避免影响其他功能）
    });
  });
}
// 5.8 旋转与翻转功能（最终版：保留原有生效逻辑+设为原图+重置）
if (rotateLeftBtn && rotateRightBtn && rotate180Btn && rotateAngle && rotateSetOriginalBtn && rotateResetBtn) {
  // 1. 规范角度为 0~360 的整数（原有逻辑，不修改）
  function normalizeAngle(angle) {
    return Math.round((angle % 360 + 360) % 360);
  }

  // 2. 极致短防抖（原有1ms，保持你之前的实时响应）
  function debounce(func, delay = 0.01) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // 3. 核心：获取最新图像源（原有逻辑，确保叠加生效）
  function getLatestProcessedSrc() {
    return processedImg.src && processedImg.src !== 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' 
      ? processedImg.src 
      : originalImg.src;
  }

// 4. 旋转处理函数（修改传参：去掉crop相关参数）
async function processRotate(angle) {
  if (!originalImg.src || isProcessing || normalizeAngle(angle) === currentRotation) return;
  
  isProcessing = true;
  try {
    const normalizedAngle = normalizeAngle(angle);
    const latestSrc = getLatestProcessedSrc();
    
    // 去掉crop_x/crop_y/crop_width/crop_height，只传angle
    await processImageWithPython('rotate', {
      angle: normalizedAngle
    }, latestSrc);
    
    currentRotation = normalizedAngle;
    rotateAngle.value = normalizedAngle;
  } catch (err) {
    alert(`旋转失败：${err.message || '未知错误'}`);
  } finally {
    isProcessing = false;
  }
}

  // 5. 固定角度按钮（原有逻辑，点击立即生效）
  function handleFixedRotate(step) {
    if (!originalImg.src) {
      alert('请先打开图像！');
      return;
    }
    const newAngle = normalizeAngle(currentRotation + step);
    processRotate(newAngle);
  }

  // 固定角度按钮绑定（原有逻辑，不修改）
rotateLeftBtn.addEventListener('click', () => handleFixedRotate(90));  // 左旋转90°（传正数）
rotateRightBtn.addEventListener('click', () => handleFixedRotate(-90)); // 右旋转90°（传负数）
  rotate180Btn.addEventListener('click', () => handleFixedRotate(180));

// 6. 自由角度输入（修复手动输入无响应问题）
const debouncedProcessRotate = debounce(processRotate, 300); // 加防抖延迟（300ms）

if (rotateAngle) { // 先判空，避免DOM未找到的错误
  rotateAngle.addEventListener('input', (e) => {
    // 1. 处理输入值：允许手动输入数字，非数字则设为0
    let inputAngle = parseInt(e.target.value.trim());
    if (isNaN(inputAngle)) {
      inputAngle = 0;
    }
    // 2. 限制角度范围在-180~180之间
    inputAngle = Math.max(-180, Math.min(180, inputAngle));
    // 3. 归一化角度（转成0~360）
    const normalizedAngle = normalizeAngle(inputAngle);
    // 4. 更新输入框显示（保留原始输入的正负，比如-45会显示-45，而不是315）
    e.target.value = inputAngle; 
    // 5. 触发旋转处理
    debouncedProcessRotate(normalizedAngle);
  });
}
  // 7. 翻转处理函数（原有生效逻辑，不修改）
  async function processFlip(flipType) {
    if (!originalImg.src || isProcessing) return;
    
    isProcessing = true;
    try {
      const latestSrc = getLatestProcessedSrc();
      await processImageWithPython('flip', { type: flipType }, latestSrc);
    } catch (err) {
      alert(`翻转失败：${err.message || '未知错误'}`);
    } finally {
      isProcessing = false;
    }
  }

  // 翻转按钮绑定（原有逻辑，不修改）
  if (flipVerticalBtn && flipHorizontalBtn && flipBothBtn) {
    flipVerticalBtn.addEventListener('click', () => processFlip(0));
    flipHorizontalBtn.addEventListener('click', () => processFlip(1));
    flipBothBtn.addEventListener('click', () => processFlip(-1));
  }

  // 8. 设为原图功能（保留，调用全局函数，右图→左图）
  rotateSetOriginalBtn.addEventListener('click', () => {
    setProcessedAsOriginal({
      resetRotation: true,
      resetCrop: false
    });
  });

  // 9. 重置功能（新增，右图恢复左图+参数归零）
  rotateResetBtn.addEventListener('click', () => {
    if (!originalImg || !originalImg.src) {
      alert('请先打开图像！');
      return;
    }

    // 右图恢复为左图状态
    processedImg.src = originalImg.src;
    if (processedPlaceholder) {
      processedPlaceholder.style.display = 'none';
    }

    // 旋转参数归零
    currentRotation = 0;
    rotateAngle.value = 0;

    alert('已重置：右图恢复为原图状态，参数已归零！');
  });
}

// processImageWithPython 函数保持你之前的生效版本（不修改）
function processImageWithPython(funcType, params, imgSrc = originalImg.src) {
  return new Promise((resolve, reject) => {
    if (!imgSrc) {
      reject(new Error("无有效图像源"));
      return;
    }

    ipcRenderer.send('process-image', {
      funcType,
      params,
      imgSrc
    });

    ipcRenderer.once('image-processed', (event, result) => {
      if (result.success && result.dataUrl) {
        processedImg.src = result.dataUrl;
        if (processedPlaceholder) {
          processedPlaceholder.style.display = 'none';
        }
        resolve(result.dataUrl);
      } else {
        reject(new Error(result.error || '图像处理失败'));
      }
    });

    setTimeout(() => {
      reject(new Error("处理超时，请重试"));
    }, 5000);
  });
}


// ========================= 全局统一函数：将处理后图像（右图）设为新原图（左图） =========================
/**
 * 全局统一设为原图函数（最终版，无多余逻辑）
 * @param {Object} options - 可选配置
 * @param {boolean} options.resetCrop - 是否重置裁剪框（默认true）
 * @param {boolean} options.resetRotation - 是否重置旋转角度（默认true）
 */
async function setProcessedAsOriginal(options = {}) {
  const { resetCrop = true, resetRotation = true } = options;

  // 1. 基础校验
  if (!originalImg || !originalImg.src) {
    alert('请先打开图像！');
    return false;
  }
  const isProcessedValid = processedImg && processedImg.src && 
    processedImg.src !== 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  if (!isProcessedValid) {
    alert('请先执行处理操作生成处理结果！');
    return false;
  }

  try {
    // 2. 保存历史记录（支持撤销）
    if (imageHistory[historyIndex] !== originalImg.src) {
      imageHistory.splice(historyIndex + 1);
      imageHistory.push(originalImg.src);
      historyIndex = imageHistory.length - 1;
      updateUndoRedoBtn && updateUndoRedoBtn(); // 兼容无此函数的情况
    }

    // 3. 核心逻辑：左图（原图）= 右图（处理图）
    originalImg.src = processedImg.src;

    // 4. 等待左图加载完成（关键：避免尺寸同步失败）
    await new Promise((resolve) => {
      const onLoad = () => {
        originalImg.removeEventListener('load', onLoad);
        originalImg.removeEventListener('error', onLoad);
        resolve();
      };
      originalImg.addEventListener('load', onLoad);
      originalImg.addEventListener('error', onLoad);
    });

    // 5. 校验加载状态
    if (!originalImg.complete || originalImg.naturalWidth <= 0) {
      throw new Error('新原图加载失败');
    }

    // 6. 同步核心状态
    originalWidth = originalImg.naturalWidth;
    originalHeight = originalImg.naturalHeight;

    // 7. 按需重置功能状态
    if (resetRotation && typeof currentRotation !== 'undefined') {
      currentRotation = 0;
      rotateAngle && (rotateAngle.value = 0);
    }
    if (resetCrop && typeof initCropBox === 'function') {
      initCropBox();
    }

    // 8. 仅隐藏左图占位提示（右图保留处理状态）
    originalPlaceholder && (originalPlaceholder.style.display = 'none');

    alert('已将处理结果设为新原图，可继续编辑！');
    return true;
  } catch (err) {
    console.error('设为原图失败：', err);
    alert(`设为原图失败：${err.message || '未知错误'}`);
    return false;
  }
}

// ========================= 4. 曲线功能核心函数（彻底修复作用域+逻辑统一） =========================

/**
 * 重置曲线为线性（保持当前通道）
 */
function resetCurveToLinear() {
  if (!curveCanvas) return;
  const linearPoints = [
    { x: 0, y: curveCanvas.height },
    { x: curveCanvas.width, y: 0 }
  ];
  curvePoints.rgb = [...linearPoints];
  curvePoints.r = [...linearPoints];
  curvePoints.g = [...linearPoints];
  curvePoints.b = [...linearPoints];
}

/**
 * 联动更新曲线
 */
function syncCurvePoints(sourceChannel) {
  if (!curveCanvas || !curvePoints[sourceChannel]) return;
  drawCurve();
  applyCurve(true);
}

/**
 * 生成曲线映射表
 */
function getCurveMap(channel) {
  if (!curveCanvas || !curvePoints[channel]) {
    return new Array(256).fill(0).map((_, i) => i);
  }
  const points = [...curvePoints[channel]].sort((a, b) => a.x - b.x);
  const map = new Array(256);
  const canvasWidth = curveCanvas.width;
  const canvasHeight = curveCanvas.height;

  for (let i = 0; i < 256; i++) {
    const x = (i / 255) * canvasWidth;
    let y = canvasHeight;

    if (points.length >= 2) {
      if (x <= points[0].x) y = points[0].y;
      else if (x >= points[points.length - 1].x) y = points[points.length - 1].y;
      else {
        for (let j = 0; j < points.length - 1; j++) {
          const p1 = points[j];
          const p2 = points[j + 1];
          if (x >= p1.x && x <= p2.x) {
            const ratio = (x - p1.x) / (p2.x - p1.x);
            y = p1.y + ratio * (p2.y - p1.y);
            break;
          }
        }
      }
    }
    map[i] = Math.max(0, Math.min(255, Math.round(255 - (y / canvasHeight) * 255)));
  }
  return map;
}

/**
 * 应用曲线
 */
function applyCurve(isPreview = false) {
  if (!curveCanvas || !curveCanvas.offsetParent) return;
  if (!originalImg || !originalImg.src || !originalImg.complete) return;

  const naturalWidth = originalImg.naturalWidth;
  const naturalHeight = originalImg.naturalHeight;
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    console.warn('图片尺寸异常，无法应用曲线');
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = naturalWidth;
  canvas.height = naturalHeight;
  const ctx = canvas.getContext('2d');
  
  try {
    ctx.drawImage(originalImg, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const rMap = getCurveMap('r');
    const gMap = getCurveMap('g');
    const bMap = getCurveMap('b');
    const rgbMap = getCurveMap('rgb');

    for (let i = 0; i < data.length; i += 4) {
      let r = rMap[data[i]];
      let g = gMap[data[i + 1]];
      let b = bMap[data[i + 2]];

      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const targetLuminance = rgbMap[Math.round(luminance)];
      const ratio = targetLuminance / (luminance || 1);

      r = Math.max(0, Math.min(255, Math.round(r * ratio)));
      g = Math.max(0, Math.min(255, Math.round(g * ratio)));
      b = Math.max(0, Math.min(255, Math.round(b * ratio)));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imageData, 0, 0);
    const processedSrc = canvas.toDataURL('image/jpeg');
    processedImg.src = processedSrc;

    if (!isPreview && processedSrc !== imageHistory[historyIndex]) {
      imageHistory.push(processedSrc);
      historyIndex = imageHistory.length - 1;
      updateUndoRedoBtn && updateUndoRedoBtn();
    }
  } catch (e) {
    console.error('应用曲线失败：', e);
  }
}

/**
 * 绘制曲线
 */
function drawCurve() {
  if (!curveCanvas || !curveCtx) return;
  const currentPoints = curvePoints[currentChannel] || [];
  if (currentPoints.length === 0) {
    resetCurveToLinear();
    return;
  }

  // 清空画布
  curveCtx.clearRect(0, 0, curveCanvas.width, curveCanvas.height);

  // 1. 绘制网格
  const gridDivisions = 6;
  const gridSize = curveCanvas.width / gridDivisions;
  curveCtx.strokeStyle = '#f3f4f6';
  curveCtx.lineWidth = 1;
  
  for (let i = 0; i <= curveCanvas.width; i += gridSize) {
    curveCtx.beginPath();
    curveCtx.moveTo(i, 0);
    curveCtx.lineTo(i, curveCanvas.height);
    curveCtx.stroke();
  }
  for (let i = 0; i <= curveCanvas.height; i += gridSize) {
    curveCtx.beginPath();
    curveCtx.moveTo(0, i);
    curveCtx.lineTo(curveCanvas.width, i);
    curveCtx.stroke();
  }

  // 2. 绘制坐标轴
  curveCtx.strokeStyle = '#9ca3af';
  curveCtx.lineWidth = 1.5;
  curveCtx.beginPath();
  curveCtx.moveTo(0, curveCanvas.height);
  curveCtx.lineTo(curveCanvas.width, curveCanvas.height);
  curveCtx.moveTo(0, 0);
  curveCtx.lineTo(0, curveCanvas.height);
  curveCtx.stroke();

  // 3. 绘制刻度
  const ticks = [0, 64, 128, 192, 255];
  curveCtx.font = '10px sans-serif';
  curveCtx.fillStyle = '#6b7280';
  ticks.forEach(tick => {
    const x = (tick / 255) * curveCanvas.width;
    const y = curveCanvas.height - (tick / 255) * curveCanvas.height;
    curveCtx.beginPath();
    curveCtx.moveTo(x, curveCanvas.height);
    curveCtx.lineTo(x, curveCanvas.height - 5);
    curveCtx.stroke();
    curveCtx.fillText(tick.toString(), x - 4, curveCanvas.height - 8);
    
    curveCtx.beginPath();
    curveCtx.moveTo(0, y);
    curveCtx.lineTo(5, y);
    curveCtx.stroke();
    curveCtx.fillText(tick.toString(), 8, y + 4);
  });

  // 4. 绘制曲线
  const sortedPoints = [...currentPoints].sort((a, b) => a.x - b.x);
  curveCtx.strokeStyle = channelColors[currentChannel] || '#000';
  curveCtx.lineWidth = 2.5;
  curveCtx.lineCap = 'round';
  curveCtx.lineJoin = 'round';
  curveCtx.beginPath();
  sortedPoints.forEach((p, i) => {
    i === 0 ? curveCtx.moveTo(p.x, p.y) : curveCtx.lineTo(p.x, p.y);
  });
  curveCtx.stroke();

  // 5. 绘制控制点
  sortedPoints.forEach(p => {
    curveCtx.fillStyle = channelColors[currentChannel] || '#000';
    curveCtx.shadowColor = 'rgba(0,0,0,0.2)';
    curveCtx.shadowBlur = 3;
    curveCtx.beginPath();
    curveCtx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    curveCtx.fill();
    curveCtx.strokeStyle = '#fff';
    curveCtx.lineWidth = 1;
    curveCtx.stroke();
  });
  curveCtx.shadowBlur = 0;

  // 6. 通道提示
  curveCtx.fillStyle = channelColors[currentChannel] || '#000';
  curveCtx.font = '14px sans-serif';
  curveCtx.fillText(`当前通道：${currentChannel.toUpperCase()}`, 10, 20);
}

/**
 * 曲线交互函数（移到全局，避免作用域冲突）
 */
function curveClickHandler(e) {
  if (!curveCanvas || !curvePoints) return;
  const rect = curveCanvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(e.clientX - rect.left, curveCanvas.width));
  const y = Math.max(0, Math.min(e.clientY - rect.top, curveCanvas.height));

  curvePoints[currentChannel].push({ x, y });
  curvePoints[currentChannel].sort((a, b) => a.x - b.x);
  syncCurvePoints(currentChannel);
  curveInput.value = Math.round((x / curveCanvas.width) * 255);
  curveOutput.value = Math.round(255 - (y / curveCanvas.height) * 255);
}

function curveMousedownHandler(e) {
  if (!curveCanvas || !curvePoints) return;
  const rect = curveCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  activePoint = curvePoints[currentChannel].find(p => 
    Math.abs(p.x - x) < 10 && Math.abs(p.y - y) < 10
  );
  isDraggingCurve = !!activePoint;
  if (activePoint) {
    curveInput.value = Math.round((activePoint.x / curveCanvas.width) * 255);
    curveOutput.value = Math.round(255 - (activePoint.y / curveCanvas.height) * 255);
  }
}

function curveMousemoveHandler(e) {
  if (!isDraggingCurve || !activePoint || !curveCanvas) return;
  const rect = curveCanvas.getBoundingClientRect();
  activePoint.x = Math.max(0, Math.min(e.clientX - rect.left, curveCanvas.width));
  activePoint.y = Math.max(0, Math.min(e.clientY - rect.top, curveCanvas.height));
  
  if (activePoint === curvePoints[currentChannel][0]) activePoint.x = 0;
  if (activePoint === curvePoints[currentChannel].at(-1)) activePoint.x = curveCanvas.width;
  
  curvePoints[currentChannel].sort((a, b) => a.x - b.x);
  syncCurvePoints(currentChannel);
  curveInput.value = Math.round((activePoint.x / curveCanvas.width) * 255);
  curveOutput.value = Math.round(255 - (activePoint.y / curveCanvas.height) * 255);
}

function curveMouseupHandler() {
  isDraggingCurve = false;
  activePoint = null;
  if (processedImg.src && processedImg.src !== imageHistory[historyIndex]) {
    imageHistory.push(processedImg.src);
    historyIndex = imageHistory.length - 1;
    updateUndoRedoBtn && updateUndoRedoBtn();
  }
}

function curveChannelChangeHandler() {
  currentChannel = curveChannelSelect.value;
  drawCurve();
  applyCurve(true);
  curveInput.value = 128;
  curveOutput.value = 128;
}

function curvePresetChangeHandler() {
  const presetKey = curvePresetSelect.value;
  if (!presetCurves[presetKey] || presetKey === 'custom') return;

  const scale = curveCanvas.width / 300;
  Object.keys(curvePoints).forEach(channel => {
    const presetPoints = presetCurves[presetKey][channel] || [];
    if (presetPoints.length > 0) {
      curvePoints[channel] = presetPoints.map(p => ({
        x: Math.round(p.x * scale),
        y: Math.round(p.y * scale)
      }));
    }
  });

  drawCurve();
  applyCurve(false);
}

function curveInputOutputHandler() {
  const input = Math.max(0, Math.min(Number(curveInput.value) || 128, 255));
  const output = Math.max(0, Math.min(Number(curveOutput.value) || 128, 255));
  const x = (input / 255) * curveCanvas.width;
  const y = curveCanvas.height - (output / 255) * curveCanvas.height;

  let closestPoint = null;
  if (curvePoints[currentChannel].length >= 2) {
    closestPoint = curvePoints[currentChannel].reduce((prev, curr) => {
      const prevDist = Math.hypot(prev.x - x, prev.y - y);
      const currDist = Math.hypot(curr.x - x, curr.y - y);
      return prevDist < currDist ? prev : curr;
    });
  }

  if (closestPoint) {
    closestPoint.x = x;
    closestPoint.y = y;
    curvePoints[currentChannel].sort((a, b) => a.x - b.x);
    syncCurvePoints(currentChannel);
  }
}

/**
 * 初始化曲线画布（仅初始化，不定义函数）
 */
function initCurveCanvas() {
  if (!curveCanvas || !curveCtx || !originalImg.complete) return;
  
  // 强制正方形画布
  const parent = curveCanvas.parentElement;
  const parentWidth = parent.clientWidth || 400;
  curveCanvas.width = parentWidth;
  curveCanvas.height = parentWidth;

  // 初始化曲线点
  const linearPoints = [
    { x: 0, y: curveCanvas.height },
    { x: curveCanvas.width, y: 0 }
  ];
  curvePoints = {
    rgb: [...linearPoints],
    r: [...linearPoints],
    g: [...linearPoints],
    b: [...linearPoints]
  };

  // 移除旧事件（避免重复绑定）
  curveCanvas.removeEventListener('click', curveClickHandler);
  curveCanvas.removeEventListener('mousedown', curveMousedownHandler);
  curveCanvas.removeEventListener('mousemove', curveMousemoveHandler);
  curveCanvas.removeEventListener('mouseup', curveMouseupHandler);
  curveChannelSelect.removeEventListener('change', curveChannelChangeHandler);
  curvePresetSelect.removeEventListener('change', curvePresetChangeHandler);
  curveInput.removeEventListener('input', curveInputOutputHandler);
  curveOutput.removeEventListener('input', curveInputOutputHandler);

  // 绑定全局交互函数
  curveCanvas.addEventListener('click', curveClickHandler);
  curveCanvas.addEventListener('mousedown', curveMousedownHandler);
  curveCanvas.addEventListener('mousemove', curveMousemoveHandler);
  curveCanvas.addEventListener('mouseup', curveMouseupHandler);
  curveChannelSelect.addEventListener('change', curveChannelChangeHandler);
  curvePresetSelect.addEventListener('change', curvePresetChangeHandler);
  curveInput.addEventListener('input', curveInputOutputHandler);
  curveOutput.addEventListener('input', curveInputOutputHandler);

  // 初始化渲染
  resetCurveToLinear();
  drawCurve();
  applyCurve(false);
}

/**
 * 曲线“重置”处理函数（全局）
 */
function handleCurveReset() {
  resetCurveToLinear();
  drawCurve();
  applyCurve(false);
  curveInput.value = 128;
  curveOutput.value = 128;
}

/**
 * 曲线按钮事件绑定（复用全局设为原图函数）
 */
function bindCurveBtnEvents() {
  if (!curveApplyBtn || !curveResetBtn) return;
  
  // 移除旧事件（修复变量名：resetCurveBtn → curveResetBtn）
  curveApplyBtn.removeEventListener('click', setProcessedAsOriginal);
  curveResetBtn.removeEventListener('click', handleCurveReset); // 这里写错了，改回curveResetBtn
  
  // 绑定全局函数（曲线的“设为原图”和其他功能统一）
  curveApplyBtn.addEventListener('click', () => {
    setProcessedAsOriginal({ resetCrop: false, resetRotation: false });
  });
  curveResetBtn.addEventListener('click', handleCurveReset);
}

// ========================= 3. 功能切换逻辑（彻底解绑，无残留） =========================
document.querySelectorAll('.func-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const func = btn.dataset.func;

    // 步骤1：解绑所有曲线事件（关键！避免占用事件资源）
    curveApplyBtn?.removeEventListener('click', setProcessedAsOriginal);
    curveResetBtn?.removeEventListener('click', handleCurveReset);
    curveCanvas?.removeEventListener('click', curveClickHandler);
    curveCanvas?.removeEventListener('mousedown', curveMousedownHandler);
    curveCanvas?.removeEventListener('mousemove', curveMousemoveHandler);
    curveCanvas?.removeEventListener('mouseup', curveMouseupHandler);
    curveChannelSelect?.removeEventListener('change', curveChannelChangeHandler);
    curvePresetSelect?.removeEventListener('change', curvePresetChangeHandler);
    curveInput?.removeEventListener('input', curveInputOutputHandler);
    curveOutput?.removeEventListener('input', curveInputOutputHandler);

    // 步骤2：隐藏所有面板
    document.querySelectorAll('.param-item').forEach(panel => panel.classList.add('hidden'));

    // 步骤3：显示当前面板并初始化
    const currentPanel = document.querySelector(`.param-item[data-func="${func}"]`);
    if (currentPanel) {
      paramPanel.classList.remove('hidden');
      currentPanel.classList.remove('hidden');
      paramTitle.textContent = currentPanel.querySelector('h4').textContent;

      // 曲线功能初始化
      if (func === 'curve') {
        setTimeout(() => {
          if (originalImg.complete) {
            initCurveCanvas();
            bindCurveBtnEvents();
          } else {
            originalImg.addEventListener('load', () => {
              initCurveCanvas();
              bindCurveBtnEvents();
            }, { once: true });
          }
        }, 100);
      }
    } else {
      paramPanel.classList.add('hidden');
    }
  });
});

// ========================= 5. 光线调节功能（保持原有逻辑，确保调用全局设为原图） =========================
if (brightnessSlider && lightSenseSlider && exposureSlider && lightAdjustResetBtn && lightAdjustSetOriginalBtn && contrastSlider && contrastValue) {
  let currentLightParams = {
    brightness: 0,
    lightSense: 0,
    exposure: 0,
    contrast: 1.0
  };

  async function processLightAdjust() {
    if (!originalImg.src || isProcessing) return;

    isProcessing = true;
    try {
      const latestSrc = getLatestProcessedSrc ? getLatestProcessedSrc() : originalImg.src;
      const result = await processImageWithPython('lightAdjust', currentLightParams, latestSrc);
      // 假设processImageWithPython会设置processedImg.src，若没有则手动添加：
      // processedImg.src = result;
    } catch (err) {
      alert(`光线调节失败：${err.message || '未知错误'}`);
    } finally {
      isProcessing = false;
    }
  }

  brightnessSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    currentLightParams.brightness = value;
    brightnessValue.textContent = `当前：${value}`;
    processLightAdjust();
  });

  lightSenseSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    currentLightParams.lightSense = value;
    lightSenseValue.textContent = `当前：${value}`;
    processLightAdjust();
  });

  exposureSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    currentLightParams.exposure = value;
    exposureValue.textContent = `当前：${value}`;
    processLightAdjust();
  });

  contrastSlider.addEventListener('input', (e) => {
    const value = parseFloat((e.target.value / 100).toFixed(1));
    currentLightParams.contrast = value;
    contrastValue.textContent = `当前：${value}`;
    processLightAdjust();
  });

  lightAdjustResetBtn.addEventListener('click', () => {
    if (!originalImg || !originalImg.src) {
      alert('请先打开图像！');
      return;
    }

    processedImg.src = originalImg.src;
    processedPlaceholder && (processedPlaceholder.style.display = 'none');

    currentLightParams = { brightness: 0, lightSense: 0, exposure: 0, contrast: 1.0 };
    brightnessSlider.value = 0;
    lightSenseSlider.value = 0;
    exposureSlider.value = 0;
    contrastSlider.value = 100;
    brightnessValue.textContent = '当前：0';
    lightSenseValue.textContent = '当前：0';
    exposureValue.textContent = '当前：0';
    contrastValue.textContent = '当前：1.0';

    alert('已重置：光线参数归零，右图恢复为原图状态！');
  });

  // 光线调节的“设为原图”（调用全局函数，逻辑统一）
  lightAdjustSetOriginalBtn.addEventListener('click', () => {
    setProcessedAsOriginal({
      resetRotation: false,
      resetCrop: false
    });

    currentLightParams = { brightness: 0, lightSense: 0, exposure: 0, contrast: 1.0 };
    brightnessSlider.value = 0;
    lightSenseSlider.value = 0;
    exposureSlider.value = 0;
    contrastSlider.value = 100;
    brightnessValue.textContent = '当前：0';
    lightSenseValue.textContent = '当前：0';
    exposureValue.textContent = '当前：0';
    contrastValue.textContent = '当前：1.0';
  });
}
// 5.10 饱和度调节
if (saturationSlider && saturationValue) {
  saturationSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    saturationValue.textContent = `当前：${value}`;
    adjustSaturation(value);
  });
}

function adjustSaturation(value) {
  const baseImg = getActiveImageElement();
  if (!baseImg || !baseImg.src || baseImg.src === 'about:blank') return;
  const width = baseImg.naturalWidth || originalImg.naturalWidth;
  const height = baseImg.naturalHeight || originalImg.naturalHeight;
  if (!width || !height) return;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(baseImg, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const saturationRatio = value / 100;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
    } else {
      h = 0; s = 0;
    }

    s *= saturationRatio;
    s = Math.max(0, Math.min(1, s));

    let r2, g2, b2;
    if (s === 0) {
      r2 = g2 = b2 = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r2 = hue2rgb(p, q, h / 360 + 1/3);
      g2 = hue2rgb(p, q, h / 360);
      b2 = hue2rgb(p, q, h / 360 - 1/3);
    }

    data[i] = Math.round(r2 * 255);
    data[i + 1] = Math.round(g2 * 255);
    data[i + 2] = Math.round(b2 * 255);
  }

  ctx.putImageData(imageData, 0, 0);
  const processedSrc = canvas.toDataURL('image/jpeg');
  processedImg.src = processedSrc;
  addToHistory(processedSrc);
}

// 5.11 HSL调节
hslChannelBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    hslChannelBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentHslChannel = btn.dataset.channel;
  });
});

if (hslHue && hslHueValue && hslSaturation && hslSaturationValue && hslLightness && hslLightnessValue) {
  hslHue.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    hslHueValue.textContent = `当前：${value}`;
  });

  hslSaturation.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    hslSaturationValue.textContent = `当前：${value}`;
  });

  hslLightness.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    hslLightnessValue.textContent = `当前：${value}`;
  });

  if (hslApplyBtn) {
    hslApplyBtn.addEventListener('click', () => {
      if (!originalImg || !originalImg.src) {
        alert('请先打开图像！');
        return;
      }
      const param = {
        hue: parseInt(hslHue.value),
        saturation: parseInt(hslSaturation.value),
        lightness: parseInt(hslLightness.value),
        channel: currentHslChannel
      };
      processImageWithPython('hsl', param);
    });
  }
}
// 5.12 色温调节
if (tempSlider && tempValue) {
  tempSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    tempValue.textContent = `当前：${value}`;
    adjustTemp(value);
  });
}

function adjustTemp(value) {
  const baseImg = getActiveImageElement();
  if (!baseImg || !baseImg.src || baseImg.src === 'about:blank') return;
  const width = baseImg.naturalWidth || originalImg.naturalWidth;
  const height = baseImg.naturalHeight || originalImg.naturalHeight;
  if (!width || !height) return;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(baseImg, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const tempRatio = value / 100;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] + tempRatio * 30));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] - tempRatio * 30));
  }

  ctx.putImageData(imageData, 0, 0);
  const processedSrc = canvas.toDataURL('image/jpeg');
  processedImg.src = processedSrc;
  addToHistory(processedSrc);
}

// 5.13 色调调节
if (tintSlider && tintValue) {
  tintSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    tintValue.textContent = `当前：${value}`;
    adjustTint(value);
  });
}

function adjustTint(value) {
  const baseImg = getActiveImageElement();
  if (!baseImg || !baseImg.src || baseImg.src === 'about:blank') return;
  const width = baseImg.naturalWidth || originalImg.naturalWidth;
  const height = baseImg.naturalHeight || originalImg.naturalHeight;
  if (!width || !height) return;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(baseImg, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const tintRatio = value / 100;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] + tintRatio * 15));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] - tintRatio * 30));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + tintRatio * 15));
  }

  ctx.putImageData(imageData, 0, 0);
  const processedSrc = canvas.toDataURL('image/jpeg');
  processedImg.src = processedSrc;
  addToHistory(processedSrc);
}

// ========================= 6. 辅助功能 =========================
// 6.1 图像缩放
if (zoomInBtn) {
  zoomInBtn.addEventListener('click', () => {
    if (currentZoom < maxZoom) {
      currentZoom += 25;
      updateZoomDisplay();
    }
  });
}

if (zoomOutBtn) {
  zoomOutBtn.addEventListener('click', () => {
    if (currentZoom > minZoom) {
      currentZoom -= 25;
      updateZoomDisplay();
    }
  });
}

function updateZoomDisplay() {
  if (zoomLevelDisplay) {
    zoomLevelDisplay.textContent = `${currentZoom}%`;
  }
  if (originalImg) {
    originalImg.style.transform = `scale(${currentZoom / 100})`;
  }
  if (processedImg) {
    processedImg.style.transform = `rotate(${currentRotation}deg) scale(${currentZoom / 100})`;
  }
}

function resetZoom() {
  currentZoom = 100;
  updateZoomDisplay();
}

// 6.2 功能面板切换
funcBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const funcName = btn.dataset.func;
    const btnText = btn.textContent.trim();

    if (paramPanel) paramPanel.classList.remove('hidden');
    if (paramTitle) paramTitle.textContent = `${btnText}参数`;

    document.querySelectorAll('.param-item').forEach(panel => {
      panel.classList.add('hidden');
    });
    const targetPanel = document.querySelector(`.param-item[data-func="${funcName}"]`);
    if (targetPanel) {
      targetPanel.classList.remove('hidden');
    }

    if (cropBox) {
      cropBox.style.display = funcName === 'crop' ? 'block' : 'none';
    }
  });
});

// 6.3 撤销/重做
if (undoBtn) {
  undoBtn.addEventListener('click', () => {
    if (historyIndex > 0) {
      historyIndex--;
      processedImg.src = imageHistory[historyIndex] || originalImg.src;
      currentZoom = 100;
      currentRotation = 0;
      updateZoomDisplay();
    } else {
      alert('已到最早操作！');
    }
  });
}

if (redoBtn) {
  redoBtn.addEventListener('click', () => {
    if (historyIndex < imageHistory.length - 1) {
      historyIndex++;
      processedImg.src = imageHistory[historyIndex];
      currentZoom = 100;
      currentRotation = 0;
      updateZoomDisplay();
    } else {
      alert('已到最新操作！');
    }
  });
}

// 6.4 隐藏占位文本
function hidePlaceholders() {
  if (originalPlaceholder) originalPlaceholder.style.display = 'none';
  if (processedPlaceholder) processedPlaceholder.style.display = 'none';
}

// 6.5 历史记录辅助函数
function addToHistory(imgSrc) {
  if (imageHistory[historyIndex] !== imgSrc) {
    imageHistory.splice(historyIndex + 1);
    imageHistory.push(imgSrc);
    historyIndex = imageHistory.length - 1;
  }
}

// ========================= 7. 核心工具函数：Python交互（临时文件版） =========================
function saveImageToTemp(imgSrc) {
  return new Promise((resolve, reject) => {
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `input_${Date.now()}.jpg`);
    const img = new Image();
    // 解决跨域问题（如果图像是远程URL或不同域名）
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          return reject(new Error('Canvas 转 Blob 失败'));
        }
        try {
          // 现在可以正常使用 await 了
          const arrayBuffer = await blob.arrayBuffer();
          const buffer = new Uint8Array(arrayBuffer);
          fs.writeFile(tempPath, buffer, (err) => {
            if (err) reject(err);
            else resolve(tempPath);
          });
        } catch (err) {
          reject(err);
        }
      }, 'image/jpeg', 0.9); // 增加质量参数（0.9=高质量）
    };

    img.onerror = (err) => {
      reject(new Error(`图像加载失败：${err.message}`));
    };
  });
}

function processImageWithPython(funcName, param) {
  if (!originalImg || !originalImg.src) return;

  try {
    saveImageToTemp(originalImg.src).then(inputTempPath => {
      const outputTempPath = path.join(os.tmpdir(), `output_${Date.now()}.jpg`);

      const pythonProcess = spawn(pythonPath, [
        pythonScriptPath,
        '--func', funcName,
        '--param', JSON.stringify(param),
        '--input', inputTempPath,
        '--output', outputTempPath
      ]);

      // 核心修改：过滤MediaPipe正常加载日志，只打印真正的Python错误
      pythonProcess.stderr.on('data', (data) => {
        const errMsg = data.toString().trim();
        // 排除MediaPipe的XNNPACK delegate加载日志（正常信息，非错误）
        if (!errMsg.startsWith('INFO: Created TensorFlow Lite XNNPACK delegate')) {
          console.error('Python错误：', errMsg);
        }
      });

      // 正常打印Python stdout日志（如必要可保留，无需过滤）
      pythonProcess.stdout.on('data', (data) => {
        console.log('Python日志:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          fs.readFile(outputTempPath, (err, data) => {
            if (err) {
              console.error('读取输出文件失败：', err);
              // 移除 alert 弹框
              return;
            }
            const processedImgSrc = `data:image/jpeg;base64,${Buffer.from(data).toString('base64')}`;
            processedImg.src = processedImgSrc;
            addToHistory(processedImgSrc);
            fs.unlink(inputTempPath, () => {});
            fs.unlink(outputTempPath, () => {});
          });
        } else {
          console.error(`Python脚本退出码：${code}，功能：${funcName}`);
          // 移除 alert 弹框
          fs.unlink(inputTempPath, () => {});
          if (fs.existsSync(outputTempPath)) {
            fs.unlink(outputTempPath, () => {});
          }
        }
      });

      pythonProcess.on('error', (err) => {
        console.error('Python调用失败:', err);
        // 移除 alert 弹框
        fs.unlink(inputTempPath, () => {});
        if (fs.existsSync(outputTempPath)) {
          fs.unlink(outputTempPath, () => {});
        }
      });
    }).catch(err => {
      console.error('保存临时文件失败：', err);
      // 移除 alert 弹框
    });
  } catch (err) {
    console.error('图像处理异常:', err);
    // 移除 alert 弹框
  }

}// ========================= 8. 页面初始化 =========================
window.onload = () => {
  if (curveCanvas) {
    curveCanvas.width = curveCanvas.offsetWidth;
    curveCanvas.height = curveCanvas.offsetHeight;
    curvePoints = [
      { x: 0, y: curveCanvas.height },
      { x: curveCanvas.width, y: 0 }
    ];
    drawCurve();
  }

  hslChannelBtns.forEach(btn => {
    if (btn.dataset.channel === 'all') btn.classList.add('active');
  });

  if (textColorPicker) {
    textColorPicker.value = '#000000';
  }

  if (textFontSelect) {
    textFontSelect.value = '黑体';
    currentTextFont = '黑体'; // 现在变量已定义
  }
  
  // 确保输入框在初始化时是可编辑的
  if (textContent) {
    textContent.disabled = false;
    textContent.readOnly = false;
  }
  if (textSize) {
    textSize.disabled = false;
    textSize.readOnly = false;
  }
  
  textboxList = [];
  activeTextBox = null;
  const oldTextBoxes = document.querySelectorAll('.text-box');
  oldTextBoxes.forEach(box => box.remove());
};