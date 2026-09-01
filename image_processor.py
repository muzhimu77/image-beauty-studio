import cv2
import numpy as np
import sys
import json
import os
import mediapipe as mp
import math
from PIL import Image, ImageDraw, ImageFont

# ========================= 初始化（保留原有MediaPipe初始化） =========================
mp_face_detection = mp.solutions.face_detection
face_detector = mp_face_detection.FaceDetection(min_detection_confidence=0.5)

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# 关键点索引定义（新增脸部轮廓关键点，用于瘦脸）
LEFT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
RIGHT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
FACE_CONTOUR_INDICES = [  # 脸部轮廓关键点（用于瘦脸）
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
]


# ========== 椭圆肤色模型（保留，用于皮肤掩码） ==========
def YCrCb_ellipse_skin_mask(img):
    skinCrCbHist = np.zeros((256, 256), dtype=np.uint8)
    cv2.ellipse(skinCrCbHist, (113, 155), (23, 25), 43, 0, 360, (255, 255, 255), -1)
    YCrCb = cv2.cvtColor(img, cv2.COLOR_BGR2YCR_CB)
    Y, Cr, Cb = cv2.split(YCrCb)
    h, w = Cr.shape
    skin_mask = np.zeros((h, w), dtype=np.uint8)
    for i in range(h):
        for j in range(w):
            if skinCrCbHist[Cr[i][j], Cb[i][j]] > 0:
                skin_mask[i][j] = 255
    kernel_small = np.ones((2, 2), np.uint8)
    kernel_large = np.ones((5, 5), np.uint8)
    skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_OPEN, kernel_small)
    skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel_large)
    skin_mask = cv2.GaussianBlur(skin_mask, (5, 5), 0)
    return skin_mask


# ========================= 原有函数（仅替换指定函数实现，其余完全保留） =========================
def lightAdjust(image, param):
    """核心修复：支持RGBA图像+优化光感调节范围+新增对比度（保留所有原名字）"""
    brightness_val = param.get("brightness", 0)
    lightSense_val = param.get("lightSense", 0)
    exposure_val = param.get("exposure", 0)
    contrast_val = param.get("contrast", 1.0)  # 新增对比度参数（原名字contrast）

    # 处理RGBA图像：保存Alpha通道，转BGR处理（原逻辑不变）
    is_rgba = image.shape[-1] == 4
    alpha_channel = None
    if is_rgba:
        alpha_channel = image[:, :, 3]
        image = cv2.cvtColor(image, cv2.COLOR_RGBA2BGR)

    # 仅当亮度参数非0时处理（原逻辑不变）
    if brightness_val != 0:
        image = brightness(image, brightness_val)

    # 仅当光感参数非0时处理（原逻辑不变）
    if lightSense_val != 0:
        lightSense_gain = (lightSense_val / 200) * 0.8 + 0.8
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        v = np.clip(v * lightSense_gain, 0, 230).astype(np.uint8)
        s = np.clip(s * (1 + lightSense_val / 500), 0, 240).astype(np.uint8)
        hsv = cv2.merge((h, s, v))
        image = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

    # 仅当曝光参数非0时处理（原逻辑不变）
    if exposure_val != 0:
        exposure_gain = np.power(1.1, exposure_val)
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        v = np.clip(v * exposure_gain, 0, 230).astype(np.uint8)
        hsv = cv2.merge((h, s, v))
        image = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

    # 新增：仅当对比度参数非1.0时处理（保留原contrast函数，不修改）
    if contrast_val != 1.0:
        # 直接调用原有contrast函数，参数格式不变
        image = contrast(image, {"value": contrast_val})

    # 恢复Alpha通道（原逻辑不变）
    if is_rgba:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGBA)
        image[:, :, 3] = alpha_channel

    return image


# 原有contrast函数完全保留（不做任何修改）
def contrast(image, param):
    """修复：支持参数对象格式，兼容前端传递"""
    value = param.get("value", 1.0)  # 从对象中获取对比度值
    is_rgba = image.shape[-1] == 4
    if is_rgba:
        image_rgb = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
    else:
        image_rgb = image.copy()
    result_rgb = np.clip((image_rgb - 127.5) * value + 127.5, 0, 255).astype(np.uint8)
    if is_rgba:
        result = cv2.cvtColor(result_rgb, cv2.COLOR_RGB2RGBA)
        result[:, :, 3] = image[:, :, 3]
    else:
        result = result_rgb
    return result


# 原有brightness函数完全保留（不做任何修改）
def brightness(image, value):
    """亮度调节：仅当参数非0时处理，避免参数为0时破坏原图"""
    if value == 0:
        return image
    is_rgba = image.shape[-1] == 4
    alpha_channel = None
    if is_rgba:
        alpha_channel = image[:, :, 3]
        image = cv2.cvtColor(image, cv2.COLOR_RGBA2BGR)
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    max_brightness = 230
    target_v = v + value
    v = np.clip(target_v, 0, max_brightness).astype(np.uint8)
    hsv = cv2.merge((h, s, v))
    result = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    if is_rgba:
        result = cv2.cvtColor(result, cv2.COLOR_BGR2RGBA)
        result[:, :, 3] = alpha_channel
    return result


def histogramEqualize(image, param):
    strength = param.get("strength", 50)
    strength_ratio = strength / 100.0
    is_rgba = image.shape[-1] == 4
    alpha_channel = None
    if is_rgba:
        b, g, r, a = cv2.split(image)
        image = cv2.merge((b, g, r))
        alpha_channel = a
    if len(image.shape) == 3:
        yuv = cv2.cvtColor(image, cv2.COLOR_BGR2YUV)
        y, u, v = cv2.split(yuv)
        y_equalized = cv2.equalizeHist(y)
        yuv_equalized = cv2.merge((y_equalized, u, v))
        result_equalized = cv2.cvtColor(yuv_equalized, cv2.COLOR_YUV2BGR)
    else:
        result_equalized = cv2.equalizeHist(image)
    result = cv2.addWeighted(image, 1 - strength_ratio, result_equalized, strength_ratio, 0).astype(np.uint8)
    if is_rgba:
        b, g, r = cv2.split(result)
        result = cv2.merge((b, g, r, alpha_channel))
    return result


# ========================= 替换/新增功能函数（不修改原有函数名） =========================
# 1. 替换原有dehaze函数实现
def dehaze(image, param):
    """
    图像去雾（亮度通道增强 + 饱和度补偿，保持输出自然）
    """
    try:
        # 1. 转换去雾强度
        strength_raw = param.get('strength', 50)
        try:
            strength_float = float(strength_raw)
        except (ValueError, TypeError):
            strength_float = 50.0
        strength = max(0.0, min(1.0, strength_float / 100) if strength_float > 1 else strength_float)

        # 2. 处理4通道RGBA图像
        is_rgba = image.shape[-1] == 4
        alpha_channel = None
        if is_rgba:
            alpha_channel = image[:, :, 3]
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2BGR)
        original = image.copy()

        # 3. LAB亮度通道CLAHE增强
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clip_limit = 1.0 + strength * 3.0
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
        l_enhanced = clahe.apply(l)
        lab_enhanced = cv2.merge((l_enhanced, a, b))
        enhanced = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)

        # 4. HSV中适度提升饱和度和亮度
        hsv = cv2.cvtColor(enhanced, cv2.COLOR_BGR2HSV).astype(np.float32)
        h, s, v = cv2.split(hsv)
        s = np.clip(s * (1.0 + strength * 0.4), 0, 255)
        v = np.clip(v * (1.0 + strength * 0.3), 0, 255)
        hsv = cv2.merge((h, s, v)).astype(np.uint8)
        enhanced = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

        # 5. 双边滤波保边去噪
        diameter = max(5, int(5 + strength * 10))
        enhanced = cv2.bilateralFilter(enhanced, diameter, 80, 80)

        # 6. 与原图混合，控制整体亮度
        result = cv2.addWeighted(original, 1 - strength, enhanced, strength, 0)

        # 恢复Alpha通道
        if is_rgba:
            result = cv2.cvtColor(result, cv2.COLOR_BGR2RGBA)
            result[:, :, 3] = alpha_channel

        return result

    except Exception as e:
        raise RuntimeError(f"去雾处理失败：{str(e)}")


# 2. 替换原有watermark函数实现
def watermark(image, param):
    """水印功能（支持中文、自定义字体大小、全局水印和右下角水印）"""
    try:
        # 从参数中获取配置（无参数时使用默认值）
        text = param.get('text', '我的水印')
        opacity = param.get('opacity', 0.5)  # 透明度0~1
        position = param.get('position', 'corner')  # 'global' 全局水印, 'corner' 右下角水印, 或 (x, y) 元组
        font_size = param.get('font_size', 20)  # 字体大小（像素）
        color = param.get('color', (255, 255, 255))  # BGR颜色格式

        # 处理4通道RGBA图像
        is_rgba = image.shape[-1] == 4
        alpha_channel = None
        if is_rgba:
            alpha_channel = image[:, :, 3]
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2BGR)

        # ========== 步骤1：将OpenCV图像转换为Pillow格式（BGR→RGB） ==========
        img_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        # 转换为RGBA模式以支持透明度合成
        if img_pil.mode != 'RGBA':
            img_pil = img_pil.convert('RGBA')

        # ========== 步骤2：加载中文字体（需替换为系统实际存在的字体路径） ==========
        # Windows 宋体路径示例
        font_path = "C:/Windows/Fonts/simsun.ttc"
        # Linux 宋体路径示例（需先安装字体：sudo apt install fonts-noto-cjk）
        # font_path = "/usr/share/fonts/opentype/noto/NotoSerifCJK-SC-Regular.otf"
        # Mac 宋体路径示例
        # font_path = "/System/Library/Fonts/PingFang.ttc"

        try:
            font = ImageFont.truetype(font_path, font_size)
        except:
            # 如果指定字体不存在，使用默认字体
            font = ImageFont.load_default()

        # ========== 步骤3：计算文字尺寸 ==========
        # 创建临时draw对象来测量文字尺寸
        temp_draw = ImageDraw.Draw(Image.new('RGB', (1, 1)))
        bbox = temp_draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        # ========== 步骤4：创建透明文字图层 ==========
        # 创建一个与原图相同大小的透明图层
        text_layer = Image.new('RGBA', img_pil.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(text_layer)

        # ========== 步骤5：颜色和透明度转换 ==========
        # 颜色转换：BGR→RGB
        rgb_color = (color[2], color[1], color[0])
        # 透明度转换：0~1 → 0~255
        alpha = int(opacity * 255)

        # ========== 步骤6：根据position类型绘制水印 ==========
        img_width, img_height = img_pil.size

        if position == 'global':
            # 全局水印：在整个图像上平铺水印
            # 计算水印间距（文字宽度和高度的1.5倍）
            spacing_x = int(text_width * 1.5)
            spacing_y = int(text_height * 1.5)

            # 从左上角开始，按间距平铺
            for y in range(0, img_height + spacing_y, spacing_y):
                for x in range(0, img_width + spacing_x, spacing_x):
                    draw.text((x, y), text, font=font, fill=(*rgb_color, alpha))

        elif position == 'corner':
            # 右下角水印：在图像右下角显示单个水印
            # 计算右下角位置（留出一些边距）
            margin = 10
            x = img_width - text_width - margin
            y = img_height - text_height - margin
            # 确保不超出图像范围
            x = max(0, x)
            y = max(0, y)
            draw.text((x, y), text, font=font, fill=(*rgb_color, alpha))

        else:
            # 兼容旧代码：如果position是元组，使用指定位置
            if isinstance(position, (list, tuple)) and len(position) >= 2:
                x, y = int(position[0]), int(position[1])
                draw.text((x, y), text, font=font, fill=(*rgb_color, alpha))
            else:
                # 默认右下角
                margin = 10
                x = img_width - text_width - margin
                y = img_height - text_height - margin
                x = max(0, x)
                y = max(0, y)
                draw.text((x, y), text, font=font, fill=(*rgb_color, alpha))

        # ========== 步骤7：将文字图层与原图合成 ==========
        watermarked = Image.alpha_composite(img_pil, text_layer)

        # ========== 步骤8：转换回OpenCV格式（RGB→BGR）并返回 ==========
        # 如果还是RGBA模式，先转换为RGB
        if watermarked.mode == 'RGBA':
            watermarked = watermarked.convert('RGB')
        watermarked = cv2.cvtColor(np.array(watermarked), cv2.COLOR_RGB2BGR)

        # 恢复Alpha通道
        if is_rgba:
            watermarked = cv2.cvtColor(watermarked, cv2.COLOR_BGR2RGBA)
            watermarked[:, :, 3] = alpha_channel

        return watermarked

    except Exception as e:
        raise RuntimeError(f"水印添加失败：{str(e)}")


# 3. 替换原有smooth函数实现（参数兼容原有调用，内部解析param）
def smooth(image, param):
    """图像平滑（参数：kernel_size：模糊核大小，值越大模糊越明显，建议1~21的奇数）"""
    try:
        # 兼容原有参数格式：如果param是数值，视为kernel_size；如果是字典，取kernel_size字段
        if isinstance(param, (int, float)):
            kernel_size = int(param)
        else:
            kernel_size = param.get('kernel_size', 5)

        # 参数范围限制
        kernel_size = max(1, min(21, int(kernel_size)))
        if kernel_size % 2 == 0:
            kernel_size += 1  # 确保是奇数

        # 处理4通道RGBA图像
        is_rgba = image.shape[-1] == 4
        alpha_channel = None
        if is_rgba:
            alpha_channel = image[:, :, 3]
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2BGR)

        # 高斯模糊（同时处理彩色和灰度图像）
        smoothed = cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)

        # 恢复Alpha通道
        if is_rgba:
            smoothed = cv2.cvtColor(smoothed, cv2.COLOR_BGR2RGBA)
            smoothed[:, :, 3] = alpha_channel

        return smoothed
    except Exception as e:
        raise RuntimeError(f"平滑处理失败：{str(e)}")


# 4. 替换原有sharpen函数实现（参数兼容原有调用，内部解析param）
def sharpen(image, param):
    """图像锐化（参数：strength：锐化强度0~1，值越大锐化越明显）"""
    try:
        # 兼容原有参数格式：如果param是数值，视为strength；如果是字典，取strength字段
        if isinstance(param, (int, float)):
            strength = float(param) / 100  # 原有是0~100，转换为0~1
        else:
            strength = param.get('strength', 0.5)

        # 限制强度在合法范围
        strength = max(0.0, min(1.0, float(strength)))

        # 处理4通道RGBA图像
        is_rgba = image.shape[-1] == 4
        alpha_channel = None
        if is_rgba:
            alpha_channel = image[:, :, 3]
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2BGR)

        # 统一转为浮点数进行计算，避免加权时溢出
        img = image.astype(np.float32)

        # 根据强度动态调整模糊半径，确保锐化程度随强度线性变化
        sigma = 0.8 + strength * 2.2  # σ范围约 0.8~3.0
        kernel = int(round(sigma * 3)) | 1  # 根据σ估算核大小，并确保为奇数

        # 高斯模糊获得平滑图像
        blurred = cv2.GaussianBlur(img, (kernel, kernel), sigma)

        # 计算细节信息并按强度放大
        amount = 0.8 + strength * 1.5  # amount 范围约 0.8~2.3
        detail = cv2.subtract(img, blurred)
        sharpened = cv2.add(img, detail * amount)

        # 裁剪像素值到0~255并转回uint8
        sharpened = np.clip(sharpened, 0, 255).astype(np.uint8)

        # 恢复Alpha通道
        if is_rgba:
            sharpened = cv2.cvtColor(sharpened, cv2.COLOR_BGR2RGBA)
            sharpened[:, :, 3] = alpha_channel

        return sharpened
    except Exception as e:
        raise RuntimeError(f"锐化处理失败：{str(e)}")

# 5. 新增HSL调整函数
def adjust_hsl(image, param):
    """
    HSL调整功能（参数：hue：色相偏移-180~180，saturation：饱和度比例0~200，lightness：明度偏移-100~100，channel：通道选择）
    """
    try:
        # 获取参数
        hue_delta = param.get('hue', 0)  # 色相偏移 -180~180
        saturation_ratio = param.get('saturation', 100)  # 饱和度比例 0~200
        lightness_delta = param.get('lightness', 0)  # 明度偏移 -100~100
        channel = param.get('channel', 'all')  # 通道选择：'all', 'red', 'green', 'blue', 'yellow', 'magenta', 'cyan'

        # 参数范围限制
        hue_delta = max(-180, min(180, int(hue_delta)))
        saturation_ratio = max(0, min(200, int(saturation_ratio))) / 100.0  # 转换为比例
        lightness_delta = max(-100, min(100, int(lightness_delta)))

        # 处理4通道RGBA图像
        is_rgba = image.shape[-1] == 4
        alpha_channel = None
        if is_rgba:
            alpha_channel = image[:, :, 3]
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2BGR)

        # 转换为HLS颜色空间（OpenCV使用H范围0-180，L/S范围0-255）
        hls = cv2.cvtColor(image, cv2.COLOR_BGR2HLS).astype(np.float32)
        h, l, s = cv2.split(hls)
        l_norm = l / 255.0
        s_norm = s / 255.0

        # 创建掩码：'all' 表示全图；否则根据色相区间筛选
        if channel == 'all':
            mask = np.ones_like(h, dtype=bool)
        else:
            h_deg = (h / 180.0) * 360.0
            if channel == 'red':
                mask = ((h_deg >= 0) & (h_deg < 45)) | ((h_deg >= 315) & (h_deg < 360))
            elif channel == 'yellow':
                mask = (h_deg >= 45) & (h_deg < 90)
            elif channel == 'green':
                mask = (h_deg >= 90) & (h_deg < 150)
            elif channel == 'cyan':
                mask = (h_deg >= 150) & (h_deg < 210)
            elif channel == 'blue':
                mask = (h_deg >= 210) & (h_deg < 270)
            elif channel == 'magenta':
                mask = (h_deg >= 270) & (h_deg < 315)
            else:
                mask = np.ones_like(h, dtype=bool)

        # 色相调整（OpenCV的H范围是0-180，因此偏移需要除以2）
        if hue_delta != 0:
            h[mask] = (h[mask] + hue_delta / 2.0) % 180.0

        # 饱和度调整（归一化范围0~1）
        if abs(saturation_ratio - 1.0) > 1e-3:
            s_norm[mask] = np.clip(s_norm[mask] * saturation_ratio, 0.0, 1.0)

        # 明度调整：提高/降低亮度，限制范围（归一化0~1）
        if lightness_delta != 0:
            l_norm[mask] = np.clip(l_norm[mask] + (lightness_delta / 100.0), 0.0, 1.0)

        # 合并并转换回BGR
        hls_adjusted = cv2.merge((
            h.astype(np.uint8),
            (l_norm * 255.0).astype(np.uint8),
            (s_norm * 255.0).astype(np.uint8)
        ))
        result = cv2.cvtColor(hls_adjusted, cv2.COLOR_HLS2BGR)

        # 恢复Alpha通道
        if is_rgba:
            result = cv2.cvtColor(result, cv2.COLOR_BGR2RGBA)
            result[:, :, 3] = alpha_channel

        return result
    except Exception as e:
        raise RuntimeError(f"HSL调整失败：{str(e)}")


# 6. 新增饱和度调整函数（基于HSL）
def saturation_adjust(image, param):
    """
    饱和度调整（参数：saturation：0~200，100为原始）
    """
    try:
        saturation = param.get('saturation', 100)
        hsl_param = {
            'hue': 0,
            'saturation': saturation,
            'lightness': 0,
            'channel': 'all'
        }
        return adjust_hsl(image, hsl_param)
    except Exception as e:
        raise RuntimeError(f"饱和度调整失败：{str(e)}")


# 7. 新增色温调整函数（基于HSL）
def color_temperature(image, param):
    """
    色温调整（参数：temperature：-100~100，负值偏蓝，正值偏黄）
    """
    try:
        # 获取色温参数，映射到色相偏移（-100~100 → -30~30色相偏移）
        temperature = param.get('temperature', 0)
        temperature = max(-100, min(100, int(temperature)))
        # 色温到色相的映射：每1单位色温对应0.3色相偏移
        hue_delta = temperature * 0.3  # 范围：-30~30

        # 调用HSL调整函数，仅调整色相，通道为all
        hsl_param = {
            'hue': hue_delta,
            'saturation': 100,
            'lightness': 0,
            'channel': 'all'
        }
        return adjust_hsl(image, hsl_param)
    except Exception as e:
        raise RuntimeError(f"色温调整失败：{str(e)}")


# 8. 新增色调调整函数（基于HSL）
def hue_adjust(image, param):
    """
    色调调整（参数：hue：-180~180，直接对应色相偏移）
    """
    try:
        hue = param.get('hue', 0)
        hsl_param = {
            'hue': hue,
            'saturation': 100,
            'lightness': 0,
            'channel': 'all'
        }
        return adjust_hsl(image, hsl_param)
    except Exception as e:
        raise RuntimeError(f"色调调整失败：{str(e)}")


# 9. 新增文字添加函数
def add_text(image, param):
    """添加文字功能（支持中文、自定义字体、大小、颜色、透明度和位置）"""
    try:
        # 解析参数
        text = param.get('content', '默认文字')
        font_size = param.get('font_size', 36)
        opacity = param.get('opacity', 1.0)
        color = param.get('color', (0, 0, 0))  # BGR 格式
        font_name = param.get('font_name', '黑体')
        x = param.get('x', 0)
        y = param.get('y', 0)

        # 参数校验
        font_size = max(12, min(100, int(font_size)))
        opacity = max(0.0, min(1.0, float(opacity)))
        if len(color) != 3:
            color = (0, 0, 0)
        pil_color = (color[2], color[1], color[0])  # BGR → RGB

        # 处理4通道RGBA图像
        is_rgba = image.shape[-1] == 4
        alpha_channel = None
        if is_rgba:
            alpha_channel = image[:, :, 3]
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2BGR)

        # 获取系统中文字体路径
        def get_system_font_path(font_name):
            if os.name == 'nt':
                font_paths = {
                    '黑体': 'C:/Windows/Fonts/simhei.ttf',
                    '宋体': 'C:/Windows/Fonts/simsun.ttc',
                    '微软雅黑': 'C:/Windows/Fonts/msyh.ttc'
                }
                return font_paths.get(font_name, 'C:/Windows/Fonts/simhei.ttf')
            elif os.uname().sysname == 'Darwin':
                font_paths = {
                    '黑体': '/Library/Fonts/SimHei.ttf',
                    '宋体': '/Library/Fonts/Songti.ttc',
                    '微软雅黑': '/Library/Fonts/Microsoft YaHei.ttc'
                }
                return font_paths.get(font_name, '/Library/Fonts/SimHei.ttf')
            else:
                font_paths = {
                    '黑体': '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
                    '宋体': '/usr/share/fonts/truetype/simsun/simsun.ttc'
                }
                default_path = font_paths.get(font_name, '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc')
                if not os.path.exists(default_path):
                    raise FileNotFoundError(f"Linux 需安装字体：sudo apt install fonts-wqy-zenhei")
                return default_path

        font_path = get_system_font_path(font_name)
        if not os.path.exists(font_path):
            raise FileNotFoundError(f"字体文件缺失：{font_path}")

        # 加载字体并绘制文字
        font = ImageFont.truetype(font_path, font_size)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(image_rgb)
        text_layer = Image.new('RGBA', pil_image.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(text_layer)

        # 计算文字尺寸，修正Y坐标（PIL文字绘制的y是基线，调整为文字顶部）
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_h = text_bbox[3] - text_bbox[1]
        y = y + text_h  # 修正Y坐标

        # 绘制文字
        draw.text(
            xy=(x, y),
            text=text,
            font=font,
            fill=(*pil_color, int(opacity * 255))
        )

        # 合成图像
        merged_pil = Image.alpha_composite(pil_image.convert('RGBA'), text_layer)
        merged_rgb = np.array(merged_pil.convert('RGB'))
        result = cv2.cvtColor(merged_rgb, cv2.COLOR_RGB2BGR)

        # 恢复Alpha通道
        if is_rgba:
            result = cv2.cvtColor(result, cv2.COLOR_BGR2RGBA)
            result[:, :, 3] = alpha_channel

        return result

    except ImportError:
        raise RuntimeError("请安装 Pillow：pip install pillow")
    except Exception as e:
        raise RuntimeError(f"文字添加失败：{str(e)}")


# ========================= 核心美颜模块（完全保留，不做任何修改） =========================
def detect_face_expanded(image):
    h, w = image.shape[:2]
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_detector.process(image_rgb)
    faces = []
    if results.detections:
        for detection in results.detections:
            bbox = detection.location_data.relative_bounding_box
            x = int(bbox.xmin * w)
            y = int(bbox.ymin * h)
            width = int(bbox.width * w)
            height = int(bbox.height * h)
            # 扩大人脸框，确保完整覆盖脸部区域
            x = max(0, x - int(width * 0.1))
            y = max(0, y - int(height * 0.25))
            width = min(w - x, int(width * 1.2))
            height = min(h - y, int(height * 1.3))
            faces.append((x, y, width, height))
    return faces


def get_skin_mask(face_roi):
    """生成皮肤掩码，仅对皮肤区域应用美颜"""
    return YCrCb_ellipse_skin_mask(face_roi)


def guided_filter(guide, src, radius=6, eps=0.01):
    """引导滤波：保留边缘，实现自然平滑"""
    guide = guide.astype(np.float32)
    src = src.astype(np.float32)
    return cv2.ximgproc.guidedFilter(
        guide=guide,
        src=src,
        radius=radius,
        eps=eps * 255 * 255
    ).astype(np.uint8)


def func_smooth(face_roi, strength):
    """磨皮功能：引导滤波实现自然平滑，保留皮肤纹理"""
    strength = strength / 100.0
    if strength <= 0:
        return face_roi
    # 强度适配滤波参数，避免过度模糊
    smoothed = guided_filter(face_roi, face_roi, radius=int(5 * strength + 3), eps=0.02)
    # 加权混合原图与磨皮结果，平衡平滑度与真实感
    return cv2.addWeighted(face_roi, 1 - strength * 0.7, smoothed, strength * 0.7, 0)


def func_whiten(face_roi, strength):
    """美白功能：仅提亮皮肤区域，不影响其他部位"""
    strength = strength / 100.0
    if strength <= 0:
        return face_roi
    skin_mask = get_skin_mask(face_roi)
    # LAB色彩空间单独提亮亮度通道，避免色彩失真
    lab = cv2.cvtColor(face_roi, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    # 仅对皮肤区域提亮，限制亮度上限避免过曝
    l = np.where(
        skin_mask > 0,
        np.clip(l + strength * 25, 0, 240),
        l
    ).astype(np.uint8)
    return cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)


# ========== 大眼功能 ==========
def bilinear_interpolation(img, vector_u, c):
    """双线性插值：保证图像缩放后像素平滑"""
    ux, uy = vector_u
    h, w = img.shape[:2]
    x1 = max(0, int(ux))
    x2 = min(w - 1, x1 + 1)
    y1 = max(0, int(uy))
    y2 = min(h - 1, y1 + 1)
    # 双线性插值计算目标像素值
    f_x_y1 = (x2 - ux) * img[y1][x1][c] + (ux - x1) * img[y1][x2][c]
    f_x_y2 = (x2 - ux) * img[y2][x1][c] + (ux - x1) * img[y2][x2][c]
    f_x_y = (y2 - uy) * f_x_y1 + (uy - y1) * f_x_y2
    return int(np.clip(f_x_y, 0, 255))


def local_scaling_warps(img, cx, cy, r_max, a):
    """局部缩放变换：实现眼部放大，不影响周边区域"""
    img1 = np.copy(img)
    h, w = img.shape[:2]
    for y in range(max(0, cy - r_max), min(h, cy + r_max + 1)):
        d = int(math.sqrt(r_max ** 2 - (y - cy) ** 2))
        x0 = max(0, cx - d)
        x1 = min(w, cx + d)
        for x in range(x0, x1 + 1):
            r = math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
            if r <= r_max:
                # 缩放系数：越靠近中心缩放越强，边缘过渡自然
                f_s = 1 - ((r / r_max - 1) ** 2) * a
                vector_u = (cx + f_s * (x - cx), cy + f_s * (y - cy))
                for c in range(3):
                    img1[y][x][c] = bilinear_interpolation(img, vector_u, c)
    return img1


def func_skin_tone(face_roi, strength):
    """大眼功能：基于人脸关键点定位，实现自然放大"""
    strength = strength / 100.0
    if strength <= 0:
        return face_roi
    h, w = face_roi.shape[:2]
    face_roi_rgb = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(face_roi_rgb)
    if not results.multi_face_landmarks:
        return face_roi
    # 提取眼部关键点，计算眼球中心
    face_landmarks = results.multi_face_landmarks[0]
    left_eye_points = []
    right_eye_points = []
    for idx in LEFT_EYE_INDICES:
        landmark = face_landmarks.landmark[idx]
        left_eye_points.append((int(landmark.x * w), int(landmark.y * h)))
    for idx in RIGHT_EYE_INDICES:
        landmark = face_landmarks.landmark[idx]
        right_eye_points.append((int(landmark.x * w), int(landmark.y * h)))
    left_eye_center = np.mean(left_eye_points, axis=0).astype(int)
    right_eye_center = np.mean(right_eye_points, axis=0).astype(int)
    # 强度适配放大参数
    a = 0.3 + strength * 0.5
    r_max = int(15 + strength * 25)
    # 对双眼分别放大，最后平滑处理
    result = local_scaling_warps(face_roi, left_eye_center[0], left_eye_center[1], r_max, a)
    result = local_scaling_warps(result, right_eye_center[0], right_eye_center[1], r_max, a)
    result = cv2.bilateralFilter(result, 5, 50, 50)
    return result


# ========== 瘦脸功能 ==========
def func_slim_face(face_roi, strength):
    """瘦脸功能：基于轮廓关键点，实现自然紧致效果"""
    strength = strength / 100.0
    if strength <= 0:
        return face_roi

    h, w = face_roi.shape[:2]
    face_roi_rgb = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(face_roi_rgb)
    if not results.multi_face_landmarks:
        return face_roi

    # 提取脸部轮廓关键点（MediaPipe 468点）
    FACE_CONTOUR_INDICES = [
        10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
        397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
        172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
    ]
    landmarks = []
    for idx in FACE_CONTOUR_INDICES:
        lm = results.multi_face_landmarks[0].landmark[idx]
        landmarks.append((int(lm.x * w), int(lm.y * h)))
    landmarks = np.array(landmarks)
    if len(landmarks) == 0:
        return face_roi

    # 计算脸部真实中线，确保对称收缩
    left_landmarks = landmarks[landmarks[:, 0] < (w // 2)]
    right_landmarks = landmarks[landmarks[:, 0] > (w // 2)]
    if len(left_landmarks) > 0 and len(right_landmarks) > 0:
        left_max_x = left_landmarks[:, 0].max()
        right_min_x = right_landmarks[:, 0].min()
        face_center_x = (left_max_x + right_min_x) // 2
    else:
        face_center_x = w // 2

    # 定义脸颊变形区域（左/右脸颊分别处理）
    left_cheek = landmarks[landmarks[:, 0] < face_center_x]
    left_inner_x = face_center_x
    left_outer_x = max(left_cheek[:, 0].min() - 10, 0)
    left_min_y = max(left_cheek[:, 1].min() - 10, 0)
    left_max_y = min(left_cheek[:, 1].max() + 10, h)

    right_cheek = landmarks[landmarks[:, 0] > face_center_x]
    right_inner_x = face_center_x
    right_outer_x = min(right_cheek[:, 0].max() + 10, w)
    right_min_y = max(right_cheek[:, 1].min() - 10, 0)
    right_max_y = min(right_cheek[:, 1].max() + 10, h)

    # 核心逻辑：内侧像素向外侧收缩，实现自然瘦脸
    result = face_roi.copy()
    shrink_intensity = 0.3 + strength * 0.6  # 强度适配收缩系数

    # 左脸颊收缩
    for y in range(left_min_y, left_max_y):
        for x in range(left_inner_x - 1, left_outer_x - 1, -1):
            dist_to_outer = x - left_outer_x
            max_dist = left_inner_x - left_outer_x
            if max_dist == 0:
                continue
            dist_ratio = dist_to_outer / max_dist  # 内侧→外侧距离比例
            shrink_offset = int(dist_ratio * shrink_intensity * strength * 8)
            new_x = x - shrink_offset  # 内侧像素向外侧移动
            new_x = max(new_x, left_outer_x)
            if new_x <= left_inner_x:
                result[y, x] = cv2.getRectSubPix(face_roi, (1, 1), (new_x, y))[0, 0]

    # 右脸颊收缩
    for y in range(right_min_y, right_max_y):
        for x in range(right_inner_x, right_outer_x):
            dist_to_outer = right_outer_x - x
            max_dist = right_outer_x - right_inner_x
            if max_dist == 0:
                continue
            dist_ratio = dist_to_outer / max_dist  # 内侧→外侧距离比例
            shrink_offset = int(dist_ratio * shrink_intensity * strength * 8)
            new_x = x + shrink_offset  # 内侧像素向外侧移动
            new_x = min(new_x, right_outer_x)
            if new_x >= right_inner_x:
                result[y, x] = cv2.getRectSubPix(face_roi, (1, 1), (new_x, y))[0, 0]

    # 平滑融合，避免收缩痕迹
    result = cv2.bilateralFilter(result, 5, 50, 50)
    result = guided_filter(face_roi, result, radius=4, eps=0.02)
    return result


# ========== 美颜主函数 ==========
def beauty(image, param):
    smooth = param.get("smooth", 0)
    whiten = param.get("whiten", 0)
    skinTone = param.get("skinTone", 0)  # 对应大眼功能
    slimFace = param.get("slimFace", 0)  # 对应瘦脸功能

    # 无美颜参数时直接返回原图
    if smooth <= 0 and whiten <= 0 and skinTone <= 0 and slimFace <= 0:
        return image

    # 处理RGBA图像：分离并保留Alpha通道
    is_rgba = image.shape[-1] == 4
    alpha_channel = None
    if is_rgba:
        b, g, r, a = cv2.split(image)
        image = cv2.merge((b, g, r))
        alpha_channel = a

    # 检测人脸区域（扩大框体确保覆盖完整）
    faces = detect_face_expanded(image)
    if len(faces) == 0:
        # 无人脸时恢复Alpha通道并返回
        if is_rgba:
            image = cv2.merge((b, g, r, alpha_channel))
        return image

    result_image = image.copy()
    for (x, y, w, h) in faces:
        face_roi = result_image[y:y + h, x:x + w].copy()
        skin_mask = get_skin_mask(face_roi)

        # 美颜处理顺序：基础优化→瘦脸→大眼（确保效果自然叠加）
        if smooth > 0:
            face_roi = func_smooth(face_roi, smooth)
        if whiten > 0:
            face_roi = func_whiten(face_roi, whiten)
        if slimFace > 0:
            face_roi = func_slim_face(face_roi, slimFace)
        if skinTone > 0:
            face_roi = func_skin_tone(face_roi, skinTone)

        # 仅替换皮肤区域，保留非皮肤细节（头发、五官等）
        skin_mask_3d = np.repeat(skin_mask[:, :, np.newaxis], 3, axis=2) / 255.0
        result_image[y:y + h, x:x + w] = (
                face_roi * skin_mask_3d + result_image[y:y + h, x:x + w] * (1 - skin_mask_3d)
        ).astype(np.uint8)

    # 恢复RGBA图像的Alpha通道
    if is_rgba:
        b, g, r = cv2.split(result_image)
        result_image = cv2.merge((b, g, r, alpha_channel))

    return result_image


# ========================= 其他原有函数（完全保留，不做任何修改） =========================
def crop(image, param):
    x = param.get("x", 0)
    y = param.get("y", 0)
    width = param.get("width", image.shape[1])
    height = param.get("height", image.shape[0])
    h, w = image.shape[:2]
    x = max(0, min(int(x), w - 1))
    y = max(0, min(int(y), h - 1))
    width = max(1, min(int(width), w - x))
    height = max(1, min(int(height), h - y))
    return image[y:y + height, x:x + width]


def rotate(image, param):
    angle = param.get("angle", 0)
    if angle % 360 == 0:
        return image  # 角度为0时直接返回原图

    try:
        h, w = image.shape[:2]
        # 核心1：计算旋转后能容纳完整图像的画布尺寸（避免切割）
        # 计算旋转矩阵（先获取旋转后的宽高）
        rotation_matrix = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
        # 计算旋转后图像的新宽高
        cos = np.abs(rotation_matrix[0, 0])
        sin = np.abs(rotation_matrix[0, 1])
        new_w = int((h * sin) + (w * cos))
        new_h = int((h * cos) + (w * sin))
        # 调整旋转矩阵的偏移量，让图像居中
        rotation_matrix[0, 2] += (new_w / 2) - (w / 2)
        rotation_matrix[1, 2] += (new_h / 2) - (h / 2)

        # 核心2：用新尺寸做旋转，确保图像完整
        border_mode = cv2.BORDER_TRANSPARENT if image.shape[-1] == 4 else cv2.BORDER_CONSTANT
        border_value = (255, 255, 255) if image.shape[-1] != 4 else (255, 255, 255, 0)
        rotated_image = cv2.warpAffine(
            image, rotation_matrix, (new_w, new_h),
            flags=cv2.INTER_LINEAR,
            borderMode=border_mode,
            borderValue=border_value
        )
        return rotated_image  # 直接返回完整旋转后的图像（无裁剪）

    except Exception as e:
        raise RuntimeError(f"旋转失败：{str(e)}")


def flip(image, param):
    flip_type = param.get("type", 0)
    return cv2.flip(image, flip_type)


def curveAdjust(image, param):
    r_curve = param.get('r_curve', list(range(256)))
    g_curve = param.get('g_curve', list(range(256)))
    b_curve = param.get('b_curve', list(range(256)))
    r_lut = np.array(r_curve, dtype=np.uint8)
    g_lut = np.array(g_curve, dtype=np.uint8)
    b_lut = np.array(b_curve, dtype=np.uint8)
    is_rgba = image.shape[-1] == 4
    alpha_channel = None
    if is_rgba:
        b, g, r, a = cv2.split(image)
        alpha_channel = a
    else:
        b, g, r = cv2.split(image)
    r_adjusted = cv2.LUT(r, r_lut)
    g_adjusted = cv2.LUT(g, g_lut)
    b_adjusted = cv2.LUT(b, b_lut)
    if is_rgba:
        result = cv2.merge((b_adjusted, g_adjusted, r_adjusted, alpha_channel))
    else:
        result = cv2.merge((b_adjusted, g_adjusted, r_adjusted))
    return result


# ========================= 主函数（仅添加新功能分支，不修改原有逻辑） =========================
def main():
    try:
        args = sys.argv[1:]
        if len(args) < 8:
            raise ValueError("参数不足：--func --param --input --output")

        func_index = args.index('--func')
        param_index = args.index('--param')
        input_index = args.index('--input')
        output_index = args.index('--output')

        func_name = args[func_index + 1]
        param_str = args[param_index + 1]
        input_path = args[input_index + 1]
        output_path = args[output_index + 1]

        param = json.loads(param_str) if param_str and param_str not in ["null", "undefined"] else {}

        image = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
        if image is None:
            raise ValueError(f"无法读取图像：{input_path}")

        result = None
        if func_name == 'brightness':
            result = brightness(image, param)
        elif func_name == 'contrast':
            result = contrast(image, param)
        elif func_name == 'histogramEqualize':
            result = histogramEqualize(image, param)
        elif func_name == 'dehaze':
            result = dehaze(image, param or {})
        elif func_name == 'watermark':
            result = watermark(image, param or {})
        elif func_name == 'beauty':
            result = beauty(image, param or {})
        elif func_name == 'detect_face':
            result = detect_face_expanded(image)
        elif func_name == 'crop':
            result = crop(image, param or {})
        elif func_name == 'rotate':
            result = rotate(image, param or {})
        elif func_name == 'smooth':
            result = smooth(image, param)
        elif func_name == 'sharpen':
            result = sharpen(image, param)
        elif func_name == 'lightAdjust':
            result = lightAdjust(image, param or {})
        elif func_name == 'flip':
            result = flip(image, param or {})
        elif func_name == 'curveAdjust':
            result = curveAdjust(image, param or {})
        # ========== 新增功能分支（仅添加，不修改原有） ==========
        elif func_name == 'hsl':
            result = adjust_hsl(image, param or {})
        elif func_name == 'saturation_adjust':
            result = saturation_adjust(image, param or {})
        elif func_name == 'color_temperature':
            result = color_temperature(image, param or {})
        elif func_name == 'hue_adjust':
            result = hue_adjust(image, param or {})
        elif func_name == 'add_text':
            result = add_text(image, param or {})
        # ======================================================
        else:
            raise ValueError(f"不支持的功能：{func_name}")

        if image.shape[-1] == 4:
            success = cv2.imwrite(output_path, result, [cv2.IMWRITE_PNG_COMPRESSION, 3])
        else:
            success = cv2.imwrite(output_path, result, [cv2.IMWRITE_JPEG_QUALITY, 90])

        if not success:
            raise RuntimeError(f"无法保存图像：{output_path}")

        sys.exit(0)
    except Exception as e:
        print(f"错误：{str(e)}", file=sys.stderr)
        sys.exit(1)


# 资源释放
def __del__():
    if 'face_mesh' in globals():
        face_mesh.close()


if __name__ == "__main__":
    main()