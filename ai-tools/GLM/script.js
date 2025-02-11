// 定义API配置
const API_KEY = '513b223d91e342a89749de9b7e449c96.WpRUlV70t5nqUSsU';
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.querySelector('textarea');
    const sendBtn = document.querySelector('.send-btn');
    const chatContainer = document.querySelector('.chat-container');
    const welcomeSection = document.querySelector('.welcome-section');
    const loadingOverlay = document.querySelector('.loading-overlay');
    let imageFile = null;

    // 自动调整文本框高度
    function adjustTextareaHeight() {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }

    textarea.addEventListener('input', adjustTextareaHeight);

    // 处理图片上传
    const uploadBtn = document.querySelector('.upload-btn');
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    imageInput.style.display = 'none';
    document.body.appendChild(imageInput);

    uploadBtn.addEventListener('click', () => imageInput.click());

    // 处理图片选择
    imageInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert('图片大小不能超过5MB');
                return;
            }
            imageFile = file;
            showImagePreview(file);
        }
    });

    function showImagePreview(file) {
        const existingPreview = document.querySelector('.image-preview');
        if (existingPreview) existingPreview.remove();

        const previewContainer = document.createElement('div');
        previewContainer.className = 'image-preview';
        
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = () => {
            previewContainer.remove();
            imageFile = null;
        };

        previewContainer.appendChild(img);
        previewContainer.appendChild(removeBtn);
        textarea.parentElement.appendChild(previewContainer);
    }

    // 发送消息
    async function sendMessage(text, image = null) {
        if (!text.trim() && !image) return;
        
        welcomeSection.style.display = 'none';
        loadingOverlay.classList.remove('hidden');

        try {
            const requestData = await prepareRequestData(text, image);
            const response = await makeApiRequest(requestData);
            displayMessage(text, image, response);
        } catch (error) {
            console.error('Error:', error);
            displayError('发送消息失败，请稍后重试');
        } finally {
            loadingOverlay.classList.add('hidden');
            resetInput();
        }
    }

    async function prepareRequestData(text, image) {
        const requestData = {
            model: "glm-4v",
            messages: [{
                role: "user",
                content: text
            }],
            stream: false,
            temperature: 0.9,
            top_p: 0.7,
            max_tokens: 1024
        };

        if (image) {
            const base64Image = await convertImageToBase64(image);
            requestData.messages[0].content = [{
                type: "text",
                text: text
            }, {
                type: "image_url",
                image_url: {
                    url: base64Image
                }
            }];
        }

        return requestData;
    }

    async function makeApiRequest(requestData) {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        return await response.json();
    }

    function displayMessage(text, image, response) {
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';

        // 用户消息
        const userMessage = document.createElement('div');
        userMessage.className = 'user-message';
        
        const userContent = document.createElement('div');
        userContent.className = 'message-content';

        // 如果有文本，添加文本
        if (text.trim()) {
            const textElement = document.createElement('p');
            textElement.className = 'message-text';
            textElement.textContent = text;
            userContent.appendChild(textElement);
        }

        // 如果有图片，添加图片
        if (image) {
            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'image-wrapper';
            const imageElement = document.createElement('img');
            imageElement.className = 'message-image';
            imageElement.src = URL.createObjectURL(image);
            imageElement.onload = () => {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            };
            imageElement.onclick = () => {
                const fullscreen = document.createElement('div');
                fullscreen.className = 'fullscreen-image';
                fullscreen.onclick = () => fullscreen.remove();
                const img = document.createElement('img');
                img.src = imageElement.src;
                fullscreen.appendChild(img);
                document.body.appendChild(fullscreen);
            };
            imageWrapper.appendChild(imageElement);
            userContent.appendChild(imageWrapper);
        }

        // 添加时间戳
        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
        userContent.appendChild(timestamp);

        userMessage.appendChild(userContent);
        messageContainer.appendChild(userMessage);

        // AI响应
        const aiMessage = document.createElement('div');
        aiMessage.className = 'ai-message';
        
        const aiContent = document.createElement('div');
        aiContent.className = 'message-content';
        
        const aiText = document.createElement('p');
        aiText.className = 'message-text';
        aiText.textContent = response.choices[0].message.content;
        aiContent.appendChild(aiText);

        // 添加AI响应时间戳
        const aiTimestamp = document.createElement('span');
        aiTimestamp.className = 'timestamp';
        aiTimestamp.textContent = new Date().toLocaleTimeString();
        aiContent.appendChild(aiTimestamp);

        aiMessage.appendChild(aiContent);
        messageContainer.appendChild(aiMessage);

        chatContainer.appendChild(messageContainer);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function displayError(message) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'message-container error';
        errorContainer.textContent = message;
        chatContainer.appendChild(errorContainer);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function resetInput() {
        textarea.value = '';
        adjustTextareaHeight();
        const preview = document.querySelector('.image-preview');
        if (preview) preview.remove();
        imageFile = null;
    }

    function convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 事件监听器
    sendBtn.addEventListener('click', () => {
        sendMessage(textarea.value.trim(), imageFile);
    });

    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(textarea.value.trim(), imageFile);
        }
    });

    // 新对话按钮
    document.querySelector('.new-chat').addEventListener('click', () => {
        chatContainer.innerHTML = '';
        welcomeSection.style.display = 'block';
        resetInput();
    });

    // 添加工具栏点击事件处理
    document.querySelectorAll('.side-toolbar .tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const prompt = btn.dataset.prompt;
            const textarea = document.querySelector('textarea');
            textarea.value = prompt;
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
            textarea.focus();
        });
    });

    // 生成星光粒子
    function createParticles() {
        const particlesContainer = document.querySelector('.particles-container');
        const particleCount = 100; // 粒子数量

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const size = Math.random() * 3 + 1; // 恢复到上一步的粒子大小范围
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.top = `${Math.random() * 100}vh`;
            particle.style.left = `${Math.random() * 100}vw`;
            particle.style.animationDuration = `${Math.random() * 2 + 1}s`; // 随机动画时长
            particlesContainer.appendChild(particle);
        }
    }

    // 页面加载时生成粒子
    createParticles();

    // 添加全屏图片查看样式
    const style = document.createElement('style');
    style.textContent = `
    .fullscreen-image {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        cursor: pointer;
    }

    .fullscreen-image img {
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    }
    `;
    document.head.appendChild(style);
});