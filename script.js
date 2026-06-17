/* =========================================
   🔑 1. APIキーの確認と保存
   ========================================= */
let API_KEY = localStorage.getItem("gemini_api_key");
if (!API_KEY) {
    API_KEY = prompt("🔑 GeminiのAPIキーを入力してください（最初だけ）");
    localStorage.setItem("gemini_api_key", API_KEY);
}

/* =========================================
   🏷️ 2. HTMLの要素を取得
   ========================================= */
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const photoInputArea = document.getElementById('photoInputArea');
const generateBtn = document.getElementById('generateBtn');
const resultSection = document.getElementById('resultSection');
const diaryOutput = document.getElementById('diaryOutput');
const deleteBtn = document.getElementById('deleteBtn');

const screenCalendar = document.getElementById('screenCalendar');
const screenEditor = document.getElementById('screenEditor');
const backBtn = document.getElementById('backBtn');

let base64Image = null;
let imageMimeType = null;

/* =========================================
   📅 3. カレンダーと保存・呼出の処理
   ========================================= */
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); 
let currentDay = new Date().getDate(); 

let selectedDateStr = `${currentYear}年${currentMonth + 1}月${currentDay}日`; 

function loadDiary(dateStr) {
    const savedDiary = localStorage.getItem(dateStr);
    
    if (savedDiary) {
        // 📖 日記がある場合
        photoInputArea.style.display = 'none';
        generateBtn.style.display = 'none';
        
        diaryOutput.textContent = savedDiary;
        resultSection.style.display = 'block';
        deleteBtn.style.display = 'block';
    } else {
        // 📝 日記がない場合
        photoInputArea.style.display = 'block';
        generateBtn.style.display = 'block';
        
        resultSection.style.display = 'none';
        deleteBtn.style.display = 'none';
        diaryOutput.textContent = '';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderCalendar();
    
    document.getElementById("selectedDateText").innerText = selectedDateStr;
    loadDiary(selectedDateStr);
    
    document.getElementById("prevMonth").addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar();
    });
    
    document.getElementById("nextMonth").addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar();
    });
});

function renderCalendar() {
    const title = document.getElementById("calendarTitle");
    const daysContainer = document.getElementById("calendarDays");
    
    title.innerText = `${currentYear}年${currentMonth + 1}月`;
    daysContainer.innerHTML = "";
    
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDiv = document.createElement("div");
        daysContainer.appendChild(emptyDiv);
    }
    
    for (let day = 1; day <= lastDay; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.innerText = day;
        
        const dateStr = `${currentYear}年${currentMonth + 1}月${day}日`;
        const realTodayStr = `${new Date().getFullYear()}年${new Date().getMonth() + 1}月${new Date().getDate()}日`;
        
        // 今日の日付だけを色付けして固定する
        if (dateStr === realTodayStr) {
            dayDiv.classList.add("selected");
        }
        
        dayDiv.addEventListener("click", () => {
            selectedDateStr = dateStr;
            document.getElementById("selectedDateText").innerText = selectedDateStr;
            
            loadDiary(selectedDateStr);

            screenCalendar.style.display = "none";
            screenEditor.style.display = "block";
        });
        
        daysContainer.appendChild(dayDiv);
    }
}

// ◀ カレンダーに戻るボタンの処理
if(backBtn) {
    backBtn.addEventListener("click", () => {
        // 🌟 カレンダーに戻る時に、選んでいた写真のデータを綺麗にリセット（消去）する
        imageInput.value = '';
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        base64Image = null;

        // 画面を「カレンダー」に戻す
        screenEditor.style.display = "none";
        screenCalendar.style.display = "block";
        renderCalendar();
    });
}

/* =========================================
   📷 4. 写真の読み込み処理
   ========================================= */
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    imageMimeType = file.type;

    const reader = new FileReader();
    reader.onload = (event) => {
        imagePreview.src = event.target.result;
        imagePreview.style.display = 'block';
        base64Image = event.target.result.split(',')[1];
    };
    reader.readAsDataURL(file);
});

/* =========================================
   🧠 5. AIに日記を書かせる＆保存する処理
   ========================================= */
generateBtn.addEventListener('click', async () => {
    if (!base64Image) {
        alert('まずは写真を選んでください！');
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = '🧠 AIが記憶を整理中...';
    
    resultSection.style.display = 'block';
    deleteBtn.style.display = 'none'; 
    diaryOutput.textContent = '（AIが文章を考えています。数秒お待ちください...）';

    // 🌟 日常モード専用のプロンプト
    const promptText = `
あなたは「思い出を少しだけ脚色する日記ライター」です。
添付された画像を元に、${selectedDateStr}の日記を書いてください。

【設定】
- 基本的には写真に写っている通りの「普通で自然な日常の日記」を書いてください。
- ただし、全体の15%くらいだけ、ほんの少し大げさに表現したり、クスッと笑えるような小さな嘘（盛った表現）をスパイスとして混ぜてください。
- 文字数: 200字〜300字程度
- 形式: 日記形式（一人称で、少しポエティックに）
`;

    const requestBody = {
        contents: [{
            parts: [
                { text: promptText },
                {
                    inlineData: {
                        mimeType: imageMimeType,
                        data: base64Image
                    }
                }
            ]
        }]
    };

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`通信エラー: ${response.status}`);
        }

        const data = await response.json();
        const diaryText = data.candidates[0].content.parts[0].text;
        
        localStorage.setItem(selectedDateStr, diaryText);
        loadDiary(selectedDateStr);

    } catch (error) {
        console.error('エラー詳細:', error);
        diaryOutput.textContent = 'エラーが発生しました。時間を置いて再度お試しください。';
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = '日常を少し盛って日記にする';
    }
});

/* =========================================
   🗑️ 6. 日記を削除する処理
   ========================================= */
deleteBtn.addEventListener('click', () => {
    if (confirm(`${selectedDateStr} の日記を本当に削除しますか？`)) {
        localStorage.removeItem(selectedDateStr);
        alert('削除しました！');
        
        imageInput.value = '';
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        base64Image = null;

        loadDiary(selectedDateStr); 
    }
});