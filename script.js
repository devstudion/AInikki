// あなたのAPIキー（正常に動いていたもの）
const API_KEY = "AQ.Ab8RN6JeoNx8n0lRGZia7HFIeZkjhUIn0vadVL96vQryM6fjoA";

// HTMLの要素を取得
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const modeSelect = document.getElementById('modeSelect');
const fakeSlider = document.getElementById('fakeSlider');
const fakeRateDisplay = document.getElementById('fakeRateDisplay');
const generateBtn = document.getElementById('generateBtn');
const resultSection = document.getElementById('resultSection');
const diaryOutput = document.getElementById('diaryOutput');
const deleteBtn = document.getElementById('deleteBtn');

let base64Image = null;
let imageMimeType = null;

/* =========================================
   📅 カレンダーと保存・呼出の処理
   ========================================= */
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); 
let currentDay = new Date().getDate(); 

// 最初から「今日の日付」をセット（例：2026年6月16日）
let selectedDateStr = `${currentYear}年${currentMonth + 1}月${currentDay}日`; 

// 💾 保存された日記を読み込む関数
function loadDiary(dateStr) {
    const savedDiary = localStorage.getItem(dateStr);
    if (savedDiary) {
        // 保存されていたら画面に出す
        diaryOutput.textContent = savedDiary;
        resultSection.style.display = 'block';
        deleteBtn.style.display = 'block';
    } else {
        // 保存されていなければ隠す
        resultSection.style.display = 'none';
        deleteBtn.style.display = 'none';
        diaryOutput.textContent = '';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderCalendar();
    
    // 画面が開いた直後に「今日の日付」と「保存された日記」を表示
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
        
        if (selectedDateStr === dateStr) {
            dayDiv.classList.add("selected");
        }
        
        dayDiv.addEventListener("click", () => {
            selectedDateStr = dateStr;
            renderCalendar(); 
            document.getElementById("selectedDateText").innerText = selectedDateStr;

            // 日付をクリックしたときに保存データを呼び出す
            loadDiary(selectedDateStr);
        });
        
        daysContainer.appendChild(dayDiv);
    }
}

/* =========================================
   📷 写真の読み込み処理
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

// スライダー（隠しているけどエラー防止のため残す）
fakeSlider.addEventListener('input', (e) => {
    fakeRateDisplay.textContent = `${e.target.value}%`;
});

/* =========================================
   🧠 AIに日記を書かせる＆保存する処理
   ========================================= */
generateBtn.addEventListener('click', async () => {
    if (!base64Image) {
        alert('まずは写真を選んでください！');
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = '🧠 AIが記憶を改ざん中...';
    resultSection.style.display = 'block';
    deleteBtn.style.display = 'none'; // 生成中は削除ボタンを隠す
    diaryOutput.textContent = '（AIが文章を考えています。数秒お待ちください...）';

    const selectedMode = modeSelect.options[modeSelect.selectedIndex].text;
    const fakeRate = fakeSlider.value;

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
        
        // ① 画面に表示する
        diaryOutput.textContent = diaryText;

        // 💾 ② ブラウザにテキストを保存する！！（ここが重要）
        localStorage.setItem(selectedDateStr, diaryText);

        // ③ 削除ボタンを表示する
        deleteBtn.style.display = 'block';

    } catch (error) {
        console.error('エラー詳細:', error);
        diaryOutput.textContent = 'エラーが発生しました。時間を置いて再度お試しください。';
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = '日記を捏造する';
    }
});

/* =========================================
   🗑️ 日記を削除する処理
   ========================================= */
deleteBtn.addEventListener('click', () => {
    if (confirm(`${selectedDateStr} の日記を本当に削除しますか？`)) {
        // ブラウザの記憶から消し去る
        localStorage.removeItem(selectedDateStr);
        
        // 画面の表示をリセット
        resultSection.style.display = 'none';
        deleteBtn.style.display = 'none';
        diaryOutput.textContent = '';
        alert('削除しました！');
    }
});