// 存储API密钥
let apiKey = {
    deepseek: 'sk-cc80caa1c04844efb15324d359a1df4c',
    moonshot: 'sk-BEVbvTROZVQzpxkRgRzVEp6zMRdQF9avyOaudiuRar4t6ajt'
};

// 模型相关变量
let currentModel = localStorage.getItem('selectedModel') || 'deepseek-reasoner';

// DOM元素
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const modelSelect = document.getElementById('modelSelect');
const saveSettingsBtn = document.getElementById('saveSettings');
const imageInput = document.getElementById('imageInput');
const toggleThemeBtn = document.getElementById('toggleTheme');

// 设置相关事件处理
settingsBtn.onclick = () => settingsModal.style.display = 'block';
window.onclick = (e) => {
    if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
}

// 在加载时设置选中的模型
modelSelect.value = currentModel;

// 保存设置
saveSettingsBtn.onclick = () => {
    currentModel = modelSelect.value;
    localStorage.setItem('selectedModel', currentModel);
    chatContainer.innerHTML = ''; // 清空聊天记录
    settingsModal.style.display = 'none';
};

// 发送消息函数
async function sendMessage() {
    const message = userInput.value.trim();
    const imageFile = imageInput.files[0];
    if (!message && !imageFile) return;

    let imageBase64 = null;

    // 如果有图片，转换为base64
    if (imageFile) {
        imageBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(imageFile);
        });
        
        // 添加图片预览
        addMessage(`<img src="${imageBase64}" alt="用户上传的图片" class="uploaded-image">`, 'user');
    }
    
    if (message) {
        addMessage(message, 'user');
    }
    
    userInput.value = '';
    imageInput.value = '';
    userInput.placeholder = "输入消息...";

    try {
        let apiEndpoint, requestBody;
        
        switch(currentModel) {
            case 'moonshot-v1-8k-vision':
                apiEndpoint = 'https://api.moonshot.cn/v1/chat/completions';
                requestBody = {
                    model: "moonshot-v1-8k-vision-preview",
                    messages: [
                        {
                            role: "system",
                            content: "你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话，并且可以理解图像内容。你会为用户提供安全，有帮助，准确的回答。"
                        },
                        {
                            role: "user",
                            content: imageBase64 ? [
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: imageBase64
                                    }
                                },
                                {
                                    type: "text",
                                    text: message || "请描述这个图片"
                                }
                            ] : message
                        }
                    ],
                    temperature: 0.3
                };
                break;
            case 'moonshot-v1-8k':
                apiEndpoint = 'https://api.moonshot.cn/v1/chat/completions';
                requestBody = {
                    model: "moonshot-v1-8k",
                    messages: [
                        {
                            role: "system",
                            content: "你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。"
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ]
                };
                break;
            case 'deepseek-v3':
                apiEndpoint = 'https://api.deepseek.com/chat/completions';
                requestBody = {
                    model: "deepseek-chat",
                    messages: [
                        {
                            role: "system",
                            content: "你是由DeepSeek提供的新一代AI助手，拥有更强大的对话和推理能力。"
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ]
                };
                break;
            default: // deepseek-reasoner
                apiEndpoint = 'https://api.deepseek.com/chat/completions';
                requestBody = {
                    model: "deepseek-reasoner",
                    messages: [
                        {
                            role: "system",
                            content: "你是由DeepSeek提供的AI助手，擅长中英文对话。"
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ]
                };
        }

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey[currentModel.startsWith('moonshot') ? 'moonshot' : 'deepseek']}`
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            addMessage(data.choices[0].message.content, 'bot');
        } else {
            throw new Error('无效的API响应');
        }
    } catch (error) {
        addMessage('抱歉，发生错误：' + error.message, 'bot');
    }
}

// 添加消息到界面
function addMessage(content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    if (content.includes('<img')) {
        messageDiv.innerHTML = content;
    } else {
        messageDiv.textContent = content;
    }
    
    if (type === 'bot') {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.innerHTML = '<span></span><span></span><span></span>';
        chatContainer.appendChild(loadingDiv);
        
        setTimeout(() => {
            loadingDiv.remove();
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 500);
    } else {
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// 事件监听
sendBtn.onclick = sendMessage;
userInput.onkeypress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// 图片上传处理
imageInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        userInput.placeholder = "已选择图片，请输入描述或直接发送...";
        // 添加激活状态样式
        document.querySelector('.image-upload-btn').classList.add('active');
    }
};

// 切换深色模式
toggleThemeBtn.onclick = () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
};

// 加载深色模式设置
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// 自动调整文本框高度
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
}); 