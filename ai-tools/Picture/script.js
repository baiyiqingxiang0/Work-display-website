// DOM元素
const toggleThemeBtn = document.getElementById('toggleTheme');
const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const sizeSelect = document.getElementById('sizeSelect');
const countSelect = document.getElementById('countSelect');
const imageGrid = document.getElementById('imageGrid');
const loadingSpinner = document.querySelector('.loading-spinner');
const modelSelect = document.getElementById('modelSelect');
const stepsSelect = document.getElementById('stepsSelect');

// API配置
const TOGETHER_API_KEY = 'c746595cca0e0787a951f35341da6d8d7257c589063e6081ad90db84cfbaf07a'; // 替换为你的API密钥

// 检查本地存储中的主题设置
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
}

// 切换深色模式
toggleThemeBtn.onclick = () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', 
        document.body.classList.contains('dark-mode') ? 'dark' : 'light'
    );
};

// 显示错误消息
function showError(message) {
    alert(message);
}

// 生成图像
async function generateImages() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        showError('请输入提示词！');
        return;
    }

    // 显示加载动画
    loadingSpinner.classList.remove('hidden');
    generateBtn.disabled = true;
    generateBtn.textContent = '生成中...';

    try {
        const size = sizeSelect.value.split('x');
        const requestBody = {
            model: modelSelect.value,
            prompt: prompt,
            width: parseInt(size[0]),
            height: parseInt(size[1]),
            steps: parseInt(stepsSelect.value),
            n: parseInt(countSelect.value),
            seed: Math.floor(Math.random() * 10000),
            response_format: "b64_json"
        };

        const response = await fetch('https://api.together.xyz/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOGETHER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        // 调试信息
        console.log('Request Body:', requestBody);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error Response:', errorData);
            throw new Error(`生成图像失败: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        
        // 清空现有图像
        imageGrid.innerHTML = '';

        // 处理返回的图像数据
        if (data.data && Array.isArray(data.data)) {
            data.data.forEach((imageData, index) => {
                const imageContainer = document.createElement('div');
                imageContainer.className = 'image-container';

                const imgElement = document.createElement('img');
                imgElement.src = `data:image/png;base64,${imageData.b64_json}`;
                imgElement.alt = `Generated image ${index + 1}`;
                imgElement.className = 'generated-image';
                
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'download-btn';
                downloadBtn.textContent = '下载图片';
                downloadBtn.onclick = () => downloadImage(imageData.b64_json, `generated-image-${index + 1}.png`);
                
                imageContainer.appendChild(imgElement);
                imageContainer.appendChild(downloadBtn);
                imageGrid.appendChild(imageContainer);
            });
        } else {
            throw new Error('API返回的数据格式不正确');
        }
    } catch (error) {
        console.error('Error generating images:', error);
        showError(error.message);
    } finally {
        // 恢复按钮状态
        loadingSpinner.classList.add('hidden');
        generateBtn.disabled = false;
        generateBtn.textContent = '生成图像';
    }
}

// 下载图片功能
function downloadImage(base64Data, fileName) {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64Data}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 事件监听
generateBtn.onclick = generateImages;

// 支持Enter键生成图像
promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        generateImages();
    }
});

// 添加错误处理
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ', msg, '\nURL: ', url, '\nLine: ', lineNo, '\nColumn: ', columnNo, '\nError object: ', error);
    showError('发生未知错误，请查看控制台获取详细信息。');
    return false;
};