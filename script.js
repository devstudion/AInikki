// あなたのAPIキー
const API_KEY = "AQ.Ab8RN6LOXeJZEHem4A_xlvVmyDPQ55rRRHWKJGOfeVtvIbUkbw"; 

// 画面の各パーツを取得
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const modeSelect = document.getElementById('modeSelect');
const fakeSlider = document.getElementById('fakeSlider');
const fakeRateDisplay = document.getElementById('fakeRateDisplay');
const generateBtn = document.getElementById('generateBtn');
const resultSection = document.getElementById('resultSection');
const diaryOutput = document.getElementById('diaryOutput');

let base64Image = null;
let imageMimeType = null;

// 1. スライダーの数字をリアルタイム更新
fakeSlider.addEventListener('input', (e) => {
    fakeRateDisplay.textContent = `${e.target.value}%`;
});

// 2. 写真が選ばれた時のプレビューとデータ化
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

// 3. 「日記を捏造する」ボタンの処理
generateBtn.addEventListener('click', async () => {
    if (!base64Image) {
        alert('まずは写真を選んでください！');
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = '🧠 AIが記憶を改ざん中...';
    resultSection.style.display = 'block';
    diaryOutput.textContent = '（数秒かかります...）';

    const selectedMode = modeSelect.options[modeSelect.selectedIndex].text;
    const fakeRate = fakeSlider.value;

    const promptText = `
あなたは「思い出を勝手に捏造する日記ライター」です。
添付された画像を元に、今日の日記を書いてください。

【設定】
- トーン・モード: ${selectedMode}
- 捏造率（嘘の度合い）: ${fakeRate}%
  (0%なら写真の事実をありのままに、100%なら写真の要素からぶっ飛んだ妄想を展開して、全く別の世界線の嘘をつくこと)
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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`通信エラー: ${response.status}`);
        }

        const data = await response.json();
        const diaryText = data.candidates[0].content.parts[0].text;
        
        diaryOutput.textContent = diaryText;

    } catch (error) {
        console.error('エラー詳細:', error);
        diaryOutput.textContent = 'エラーが発生しました。コンソールを確認してください。';
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = '日記を捏造する';
    }
});