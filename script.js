/* =========================================
   🔑 1. APIキーの確認と保存（安全なプロ仕様）
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
const modeSelect = document.getElementById('modeSelect');
const fakeSlider = document.getElementById('fakeSlider');
const fakeRateDisplay = document.getElementById('fakeRateDisplay');
const generateBtn = document.getElementById('generateBtn');
const resultSection = document.getElementById('resultSection');
const diaryOutput = document.getElementById('diaryOutput');
const deleteBtn = document.getElementById('deleteBtn');

// 画面切り替え用の要素
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

// 基準となる日付
let selectedDateStr = `${currentYear}年${currentMonth + 1}月${currentDay}日`; 

// 💾 保存された日記を読み込んで、画面の表示をスマートに切り替える関数
function loadDiary(dateStr) {
    const savedDiary = localStorage.getItem(dateStr);
    const photoInputArea = imageInput.parentElement; // 写真を選ぶエリア
    
    if (savedDiary) {
        // 📖 日記がある場合：写真入力と生成ボタンを隠して、結果だけをスッキリ表示！
        photoInputArea.style.display = 'none';
        generateBtn.style.display = 'none';
        
        diaryOutput.textContent = savedDiary;
        resultSection.style.display = 'block';
        deleteBtn.style.display = 'block';
    } else {
        // 📝 日記がない場合：写真入力を表示して、結果エリアを隠す！
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
        
        // 🌟 実際の内蔵時計の「今日」だけを青く固定する！
        const realTodayStr = `${new Date().getFullYear()}年${new Date().getMonth() + 1}月${new Date().getDate()}日`;
        if (dateStr === realTodayStr) {
            dayDiv.classList.add("selected");
        }
        
        dayDiv.addEventListener("click", () => {
            selectedDateStr = dateStr;
            document.getElementById("selectedDateText").innerText = selectedDateStr;
            
            // その日の日記データを読み込む
            loadDiary(selectedDateStr);

            // 🔄 画面を「日記エディタ」に切り替える（中に入る動き）
            screenCalendar.style.display = "none";
            screenEditor.style.display = "block";
        });
        
        daysContainer.appendChild(dayDiv);
    }
}

// ◀ カレンダーに戻るボタンの処理
if(backBtn) {
    backBtn.addEventListener("click", () => {
        // 画面を「カレンダー」に戻す
        screenEditor.style.display = "none";
        screenCalendar.style.display = "block";
        
        // カレンダーを再描画して最新の状態にする
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

// スライダー
if(fakeSlider) {
    fakeSlider.addEventListener('input', (e) => {
        if(fakeRateDisplay) fakeRateDisplay.textContent = `${e.target.value}%`;
    });
}

/* =========================================
   🧠 5. AIに日記を書かせる＆保存する処理
   ========================================= */
generateBtn.addEventListener('click', async () => {
    if (!base64Image) {
        alert('まずは写真を選んでください！');
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = '🧠 AIが記憶を改ざん中...';
    
    // 生成中は一時的に結果エリアを見せておく
    resultSection.style.display = 'block';
    deleteBtn.style.display = 'none'; 
    diaryOutput.textContent = '（AIが文章を考えています。数秒お待ちください...）';

    let selectedMode = "感動"; // default
    if (modeSelect && modeSelect.options[modeSelect.selectedIndex]) {
         selectedMode = modeSelect.options[modeSelect.selectedIndex].text;
    }
    let fakeRate = fakeSlider ? fakeSlider.value : 100;

    const promptText = `
あなたは「思い出を勝手に捏造する日記ライター」です。
添付された画像を元に、${selectedDateStr}の日記を書いてください。

【設定】
- トーン・モード: ${selectedMode}
- 捏造率（嘘の度合い）: ${fakeRate}%
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
        
        // 💾 ローカルストレージに保存する
        localStorage.setItem(selectedDateStr, diaryText);

        // 🌟 これを呼ぶことで、入力欄がサッと消えて結果が美しく表示されます！
        loadDiary(selectedDateStr);

    } catch (error) {
        console.error('エラー詳細:', error);
        diaryOutput.textContent = 'エラーが発生しました。時間を置いて再度お試しください。';
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = '日記を捏造する';
    }
});

/* =========================================
   🗑️ 6. 日記を削除する処理
   ========================================= */
deleteBtn.addEventListener('click', () => {
    if (confirm(`${selectedDateStr} の日記を本当に削除しますか？`)) {
        // ブラウザの記憶から消し去る
        localStorage.removeItem(selectedDateStr);
        alert('削除しました！');
        
        // 画像プレビューもリセットしておく
        imageInput.value = '';
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        base64Image = null;

        // 🌟 画面を「日記がない状態（入力画面）」に自動で戻す！
        loadDiary(selectedDateStr); 
    }
});