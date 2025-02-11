// DOM元素
const toggleThemeBtn = document.getElementById('toggleTheme');

// 检查本地存储中的主题设置
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
}

// 切换深色模式
toggleThemeBtn.onclick = () => {
    document.body.classList.toggle('dark-mode');
    // 保存主题设置到本地存储
    localStorage.setItem('theme', 
        document.body.classList.contains('dark-mode') ? 'dark' : 'light'
    );
};

// 为服务卡片添加点击事件
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', function() {
        // 这里可以添加点击卡片后的跳转逻辑
        const serviceName = this.querySelector('h3').textContent;
        console.log(`Clicked on ${serviceName}`);
        // 根据服务名称跳转到相应的页面
        // window.location.href = `/${serviceName.toLowerCase()}`;
    });
});