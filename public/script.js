// ImgurのクライアントID
const IMGUR_CLIENT_ID = 'e484a9032da395e';  // あなたのImgurクライアントIDに置き換えてください

// サムネプレビューを画像選択ボタンとして機能させる
document.getElementById('profileImagePreview').addEventListener('click', () => {
    document.getElementById('profileImageUpload').click();
});

document.getElementById('profileImageUpload').addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('image', file);

        fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: { Authorization: `Client-ID ${IMGUR_CLIENT_ID}` },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const imageUrl = data.data.link;
                localStorage.setItem('profileImage', imageUrl);
                document.getElementById('profileImagePreview').src = imageUrl;
            }
        })
        .catch(error => console.error('画像のアップロードに失敗しました:', error));
    }
});

// ページ読み込み時にプロフィール画像を設定
window.addEventListener('load', () => {
    const savedProfileImage = localStorage.getItem('profileImage') || 'https://cdn.glitch.global/3b848cc8-5c7c-4ec0-a4e0-3be50b6e7d71/default_profile_400x400_l.jpg?v=1733292762380';
    document.getElementById('profileImagePreview').src = savedProfileImage;
});




document.getElementById('tweetForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const tweetContent = document.getElementById('tweetContent').value;
    const profileImage = localStorage.getItem('profileImage') || 'https://cdn.glitch.global/3b848cc8-5c7c-4ec0-a4e0-3be50b6e7d71/default_profile_400x400_l.jpg?v=1733292762380';

    fetch('/api/tweets', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, tweetContent, profileImage }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateTimeline();
            document.getElementById('tweetContent').value = '';
        }
    });
});


function updateTimeline() {
    fetch('/api/tweets')
        .then(response => response.json())
        .then(tweets => {
            const timeline = document.getElementById('timeline');
            timeline.innerHTML = '';

            // ユーザーごとの投稿数をカウント
            const userTweetCounts = {};
            tweets.forEach(tweet => {
                userTweetCounts[tweet.username] = (userTweetCounts[tweet.username] || 0) + 1;
            });

            tweets.forEach(tweet => {
                const tweetElement = document.createElement('div');
                tweetElement.classList.add('tweet');
                const timeAgo = calculateTimeAgo(tweet.timestamp);

                // ＠ユーザーネームと #ハッシュタグを青色に変更
                let tweetContentWithLinks = convertToLinks(tweet.content);
              
                                           // 半角ハッシュタグ (#) を全角 (＃) に置き換え
tweetContentWithLinks = tweetContentWithLinks.replace(
    /#([^\s\n]+)/g,
    '＃$1'
);
              
                tweetContentWithLinks = tweetContentWithLinks.replace(
                    /＠([^\s\n]+)/g,
                    '<span style="color: #1DA1F2;">＠$1</span>'
                );
                tweetContentWithLinks = tweetContentWithLinks.replace(
                    /＃([^\s\n]+)/g,
                    '<span style="color: #1DA1F2;">＃$1</span>'
                );

                // 改行を <br> に変換
                tweetContentWithLinks = convertNewlinesToBr(tweetContentWithLinks);

// 投稿数に応じてバッジ画像を選択
let badgeUrl = "https://cdn.glitch.global/3b848cc8-5c7c-4ec0-a4e0-3be50b6e7d71/checkmark%EF%BC%91%20(1).png?v=1736901694586"; // デフォルトバッジ

if (tweet.username === 'しこりくん' || tweet.username === 'しょんべんマン') {
    // AI専用のバッジ
    badgeUrl = "https://cdn.glitch.global/3b848cc8-5c7c-4ec0-a4e0-3be50b6e7d71/checkmark%20(1)%20(1)%20(1).png?v=1736902301109"; // AI専用バッジURL
} else {
    const postCount = userTweetCounts[tweet.username];
    if (postCount > 500) {
        badgeUrl = "https://cdn.glitch.global/3b848cc8-5c7c-4ec0-a4e0-3be50b6e7d71/checkmark%20(1)%20(1).png?v=1736901702918"; // 500超えのバッジURL
    } else if (postCount > 150) {
        badgeUrl = "https://cdn.glitch.global/3b848cc8-5c7c-4ec0-a4e0-3be50b6e7d71/checkmark3%20(1).png?v=1736901700754"; // 150超えのバッジURL
    } else if (postCount > 50) {
        badgeUrl = "https://cdn.glitch.global/3b848cc8-5c7c-4ec0-a4e0-3be50b6e7d71/checkmark2%20(1).png?v=1736901697475"; // 50超えのバッジURL
    }
}


tweetElement.innerHTML = `
    <div class="tweet-header" style="display: flex; align-items: center; margin-bottom: 10px;">
        <img src="${tweet.profileImage || 'https://cdn.glitch.global/3b848cc8-5c7c-4ec0-a4e0-3be50b6e7d71/default_profile_400x400_l.jpg?v=1733292762380'}" 
            alt="プロフィール画像" 
            class="profile-image" 
            style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
        <strong class="username" style="display: flex; align-items: center; margin-right: 5px;">
            ${tweet.username}
            <img src="${badgeUrl}" alt="バッジ" class="checkmark-icon" style="margin-left: 5px; width: 16px; height: 16px;">
        </strong>
        <small style="color: #888; margin-left: 5px;">${timeAgo}</small>
    </div>
    <p>${tweetContentWithLinks}</p>
`;


                const usernameElement = tweetElement.querySelector('.username');
                // クリック時に＠ユーザーネームをテキストとして投稿フォームに挿入
                usernameElement.addEventListener('click', function () {
                    const username = tweet.username;
                    const tweetContent = document.getElementById('tweetContent');
                    tweetContent.value = `＠${username}`;
                });

                timeline.appendChild(tweetElement);
            });
        });
}



// ページが読み込まれた時に、保存されている名前を入力欄に設定する
window.addEventListener('load', () => {
    const savedName = localStorage.getItem('username');  // 'username' というキーで保存されたデータを取得
    if (savedName) {
        document.getElementById('username').value = savedName;  // 取得した名前を入力欄に表示
    }
});

// 名前の入力が変更されたら、それを localStorage に保存する
document.getElementById('username').addEventListener('input', (event) => {
    const username = event.target.value;
    localStorage.setItem('username', username);  // 'username' というキーで入力された名前を保存
});




document.addEventListener("DOMContentLoaded", function() {
    document.getElementById('uploadImageBtn').addEventListener('click', () => {
        document.getElementById('imageUpload').click();
    });

    document.getElementById('imageUpload').addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('image', file);

            fetch('https://api.imgur.com/3/image', {
                method: 'POST',
                headers: {
                    Authorization: `Client-ID ${IMGUR_CLIENT_ID}`
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const imageUrl = data.data.link;
                    document.getElementById('tweetContent').value += `\n${imageUrl}`;
                }
            })
            .catch(error => console.error('画像のアップロードに失敗しました: ', error));
        }
    });
    updateTimeline();
});

function calculateTimeAgo(timestamp) {
    const now = new Date();
    const tweetTime = new Date(timestamp);
    const diff = now - tweetTime;
    const minutes = Math.floor(diff / 1000 / 60);
    if (minutes < 60) return `${minutes}分前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間前`;
    const days = Math.floor(hours / 24);
    return `${days}日前`;
}

function convertToLinks(text) {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlPattern, (url) => {
        if (url.includes('imgur.com')) {
            // Imgurリンクはサムネイル画像として表示
            return `<img src="${url}" class="thumbnail" alt="Imgur Image" loading="lazy" />`;
        } else if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
            // YouTubeリンクを埋め込み動画として表示
            const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (videoId) {
                return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            }
          } else if (url.includes('youtube.com/shorts') || url.includes('youtu.be/')) {
    // YouTubeリンクを埋め込み動画として表示
    const videoId = url.match(/(?:youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (videoId) {
        return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    }          
        } else if (url.includes('nicovideo.jp/watch')) {
            // ニコニコ動画リンクを埋め込み動画として表示
            const videoId = url.match(/nicovideo\.jp\/watch\/(sm[0-9]+)/);
            if (videoId) {
                return `<iframe width="560" height="315" src="https://embed.nicovideo.jp/watch/${videoId[1]}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
            }
        } else if (url.includes('playemulator.io')) {
            // PlayEmulatorリンクを埋め込みとして表示
            return `<iframe width="800" height="600" src="${url}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
        } else if (url.includes('scratch.mit.edu/projects/')) {
            // Scratchリンクをiframeで埋め込み表示
            const projectId = url.match(/projects\/(\d+)/)[1];
            return `<iframe src="https://scratch.mit.edu/projects/${projectId}/embed" allowfullscreen style="width: 485px; height: 402px; border: none;"></iframe>`;
        }
        // その他のリンクはリンクテキストのみ表示
        return `<a href="${url}" target="_blank">${url}</a>`;
    });
}




function convertNewlinesToBr(text) {
    return text.replace(/\n/g, '<br>');
}
// クライアント側のニュース取得スクリプト
document.addEventListener("DOMContentLoaded", function() {
    fetch('/api/news')
        .then(response => response.json())
        .then(newsData => {
            let newsList = document.getElementById("news-list");
            newsList.innerHTML = '';

            // ニュース記事をリスト表示
            newsData.forEach(item => {
                let listItem = document.createElement("li");
                let linkElement = document.createElement("a");
                linkElement.href = item.link;
                linkElement.textContent = item.title;
                linkElement.target = "_blank"; // 新しいタブで開く

                listItem.appendChild(linkElement);
                newsList.appendChild(listItem);
            });
        })
        .catch(error => console.error("ニュースの取得に失敗しました: ", error));
});

// 急上昇ワードのリストを更新する関数
function updateTrendingHashtags() {
    fetch('/api/trending-hashtags')
        .then(response => response.json())
        .then(hashtags => {
            const trendingList = document.getElementById('trending-list');
            trendingList.innerHTML = ''; // 既存のリストをクリア

            hashtags.forEach((hashtag, index) => {
                const listItem = document.createElement('li');
              listItem.style.listStyleType = 'none';  // リストアイコンを非表示
             let backgroundColor;

switch (index + 1) {
    case 1:
        backgroundColor = '#FF4500'; // 赤
        break;
    case 2:
        backgroundColor = '#FFA500'; // オレンジ
        break;
    case 3:
        backgroundColor = '#c39143'; // 黄土色
        break;
    case 4:
    case 5:
        backgroundColor = '#A9A9A9'; // グレー
        break;
    default:
        backgroundColor = '#FFFFFF'; // デフォルト（必要に応じて）
}

listItem.innerHTML = `<span style="display: inline-block; width: 20px; height: 20px; background-color: ${backgroundColor}; color: white; border-radius: 3px; text-align: center; font-weight: bold; margin-right: 5px;">${index + 1}</span> ${hashtag.hashtag}　<span style="font-size: 10px; font-weight: medium;">${hashtag.count}件のタグ</span>`;

                trendingList.appendChild(listItem);
            });
        })
        .catch(error => console.error('急上昇ワードの取得に失敗しました: ', error));
}

// script.txt 内の重複するshowTab関数を全て削除し、この1つだけ残す
let currentTab = null;

function showTab(tabName) {
    const tabs = document.querySelectorAll(".tab-button");
    const contents = document.querySelectorAll(".tab-content");
    
    if (currentTab === tabName) {
        contents.forEach(content => content.style.display = "none");
        tabs.forEach(tab => tab.classList.remove("selected"));
        currentTab = null;
        return;
    }
    
    currentTab = tabName;
    tabs.forEach(tab => tab.classList.remove("selected"));
    contents.forEach(content => content.style.display = "none");
    
    const selectedTab = Array.from(tabs).find(tab => tab.textContent === tabName);
    if (selectedTab) selectedTab.classList.add("selected");
    
    document.getElementById(tabName).style.display = "block";
    
    if (tabName === 'trending') {
        updateTrendingHashtags();
    }
}

const emojiCanvas = document.getElementById('emojiCanvas');
const emojiKeyboard = document.getElementById('emojiKeyboard');
const emojiTabs = document.getElementById('emojiTabs');
const ctx = emojiCanvas.getContext('2d');

let isDragging = false;
let currentEmoji = "";
let emojiPositions = [];

// 絵文字カテゴリごとのリスト
const emojis = {
    faces: ['😄',	'😃',	'😀',	'😊',	'☺',	'😉',	'😍',	'😘',	'😚',	'😗',	'😙',
'😜',	'😝',	'😛',	'😳',	'😁',	'😔',	'😌',	'😒',	'😞',	'😣',	'😢',
'😂',	'😭',	'😪',	'😥',	'😰',	'😅',	'😓',	'😩',	'😫',	'😨',	'😱',
'😠',	'😡',	'😤',	'😖',	'😆',	'😋',	'😷',	'😎',	'😴',	'😵',	'😲',
'😟',	'😦',	'😧',	'😈',	'👿',	'😮',	'😬',	'😐',	'😕',	'😯',	'😶',
'😇',	'😏',	'😑',	'👲',	'👳',	'👮',	'👷',	'💂',	'👶',	'👦',	'👧',
'👨',	'👩',	'👴',	'👵',	'👱',	'👼',	'👸',	'😺',	'😸',	'😻',	'😽',
'😼',	'🙀',	'😿',	'😹',	'😾',	'👹',	'👺',	'🙈',	'🙉',	'🙊',	'💀',
'👽',	'💩',	'🔥',	'✨',	'🌟',	'💫',	'💥',	'💢',	'💦',	'💧',	'💤',
'💨',	'👂',	'👀',	'👃',	'👅',	'👄',	'👍',	'👎',	'👌',	'👊',	'✊',
'✌',	'👋',	'✋',	'👐',	'👆',	'👇',	'👉',	'👈',	'🙌',	'🙏',	'☝',
'👏',	'💪',	'🚶',	'🏃',	'💃',	'👫',	'👪',	'👬',	'👭',	'💏',	'💑',
'👯',	'🙆',	'🙅',	'💁',	'🙋',	'💆',	'💇',	'💅',	'👰',	'🙎',	'🙍',
'🙇',	'🎩',	'👑',	'👒',	'👟',	'👞',	'👡',	'👠',	'👢',	'👕',	'👔',
'👚',	'👗',	'🎽',	'👖',	'👘',	'👙',	'💼',	'👜',	'👝',	'👛',	'👓',
'🎀',	'🌂',	'💄',	'💛',	'💙',	'💜',	'💚',	'❤',	'💔',	'💗',	'💓',
'💕',	'💖',	'💞',	'💘',	'💌',	'💋',	'💍',	'💎',	'👤',	'👥',	'💬'
],
    symbols: ['🔟',
'🔢',	'#⃣',	'🔣',	'⬆',	'⬇',	'⬅',	'➡',	'🔠',	'🔡',	'🔤',	'↗',
'↖',	'↘',	'↙',	'↔',	'↕',	'🔄',	'◀',	'▶',	'🔼',	'🔽',	'↩',
'↪',	'ℹ',	'⏪',	'⏩',	'⏫',	'⏬',	'⤵',	'⤴',	'🆗',	'🔀',	'🔁',
'🔂',	'🆕',	'🆙',	'🆒',	'🆓',	'🆖',	'📶',	'🎦',	'🈁',	'🈯',	'🈳',
'🈵',	'🈴',	'🈲',	'🉐',	'🈹',	'🈺',	'🈶',	'🈚',	'🚻',	'🚹',	'🚺',
'🚼',	'🚾',	'🚰',	'🚮',	'🅿',	'♿',	'🚭',	'🈷',	'🈸',	'🈂',	'Ⓜ',
'🛂',	'🛄',	'🛅',	'🛃',	'🉑',	'㊙',	'㊗',	'🆑',	'🆘',	'🆔',	'🚫',
'🔞',	'📵',	'🚯',	'🚱',	'🚳',	'🚷',	'🚸',	'⛔',	'✳',	'❇',	'❎',
'✅',	'✴',	'💟',	'🆚',	'📳',	'📴',	'🅰',	'🅱',	'🆎',	'🅾',	'💠',
'➿',	'♻',	'♈',	'♉',	'♊',	'♋',	'♌',	'♍',	'♎',	'♏',	'♐',
'♑',	'♒',	'♓',	'⛎',	'🔯',	'🏧',	'💹',	'💲',	'💱',	'©',	'®',
'™',	'〽',	'〰',	'🔝',	'🔚',	'🔙',	'🔛',	'🔜',	'❌',	'⭕',	'❗',
'❓',	'❕',	'❔',	'🔃',	'🕛',	'🕧',	'🕐',	'🕜',	'🕑',	'🕝',	'🕒',
'🕞',	'🕓',	'🕟',	'🕔',	'🕠',	'🕕',	'🕖',	'🕗',	'🕘',	'🕙',	'🕚',
'🕡',	'🕢',	'🕣',	'🕤',	'🕥',	'🕦',	'✖',	'➕',	'➖',	'➗',	'♠',
'♥',	'♣',	'♦',	'💮',	'💯',	'✔',	'☑',	'🔘',	'🔗',	'➰',	'🔱',
'🔲',	'🔳',	'◼',	'◻',	'◾',	'◽',	'▪',	'▫',	'🔺',	'⬜',	'⬛',
'⚫',	'⚪',	'🔴',	'🔵',	'🔻',	'🔶',	'🔷',	'🔸',	'🔹'],
    animals: ['🐶',	'🐺',	'🐱',	'🐭',	'🐹',	'🐰',	'🐸',	'🐯',	'🐨',	'🐻',	'🐷',
'🐽',	'🐮',	'🐗',	'🐵',	'🐒',	'🐴',	'🐑',	'🐘',	'🐼',	'🐧',	'🐦',
'🐤',	'🐥',	'🐣',	'🐔',	'🐍',	'🐢',	'🐛',	'🐝',	'🐜',	'🐞',	'🐌',
'🐙',	'🐚',	'🐠',	'🐟',	'🐬',	'🐳',	'🐋',	'🐄',	'🐏',	'🐀',	'🐃',
'🐅',	'🐇',	'🐉',	'🐎',	'🐐',	'🐓',	'🐕',	'🐖',	'🐁',	'🐂',	'🐲',
'🐡',	'🐊',	'🐫',	'🐪',	'🐆',	'🐈',	'🐩',	'🐾',	'💐',	'🌸',	'🌷',
'🍀',	'🌹',	'🌻',	'🌺',	'🍁',	'🍃',	'🍂',	'🌿',	'🌾',	'🍄',	'🌵',
'🌴',	'🌲',	'🌳',	'🌰',	'🌱',	'🌼',	'🌐',	'🌞',	'🌝',	'🌚',	'🌑',
'🌒',	'🌓',	'🌔',	'🌕',	'🌖',	'🌗',	'🌘',	'🌜',	'🌛',	'🌙',	'🌍',
'🌎',	'🌏',	'🌋',	'🌌',	'🌠',	'⭐',	'☀',	'⛅',	'☁',	'⚡',	'☔',
'❄',	'⛄',	'🌀',	'🌁','🌈','🌊'],
  build:['🏠',	'🏡',	'🏫',	'🏢',	'🏣',	'🏥',	'🏦',	'🏪',	'🏩',	'🏨',	'💒',
'⛪',	'🏬',	'🏤',	'🌇',	'🌆',	'🏯',	'🏰',	'⛺',	'🏭',	'🗼',	'🗾',
'🗻',	'🌄',	'🌅',	'🌃',	'🗽',	'🌉',	'🎠',	'🎡',	'⛲',	'🎢',	'🚢',
'⛵',	'🚤',	'🚣',	'⚓',	'🚀',	'✈',	'💺',	'🚁',	'🚂',	'🚊',	'🚉',
'🚞',	'🚆',	'🚄',	'🚅',	'🚈',	'🚇',	'🚝',	'🚋',	'🚃',	'🚎',	'🚌',
'🚍',	'🚙',	'🚘',	'🚗',	'🚕',	'🚖',	'🚛',	'🚚',	'🚨',	'🚓',	'🚔',
'🚒',	'🚑',	'🚐',	'🚲',	'🚡',	'🚟',	'🚠',	'🚜',	'💈',	'🚏',	'🎫',
'🚦',	'🚥',	'⚠',	'🚧',	'🔰',	'⛽',	'🏮',	'🎰',	'♨',	'🗿',	'🎪',
'🎭',	'📍',	'🚩',	'🇯🇵',	'🇰🇷',	'🇩🇪',	'🇨🇳',	'🇺🇸',	'🇫🇷',	'🇪🇸',	'🇮🇹',
'🇷🇺',	'🇬🇧',									
],
  etc:['🎍',	'💝',	'🎎',	'🎒',	'🎓',	'🎏',	'🎆',	'🎇',	'🎐',	'🎑',	'🎃',
'👻',	'🎅',	'🎄',	'🎁',	'🎋',	'🎉',	'🎊',	'🎈',	'🎌',	'🔮',	'🎥',
'📷',	'📹',	'📼',	'💿',	'📀',	'💽',	'💾',	'💻',	'📱',	'☎',	'📞',
'📟',	'📠',	'📡',	'📺',	'📻',	'🔊',	'🔉',	'🔈',	'🔇',	'🔔',	'🔕',
'📢',	'📣',	'⏳',	'⌛',	'⏰',	'⌚',	'🔓',	'🔒',	'🔏',	'🔐',	'🔑',
'🔎',	'💡',	'🔦',	'🔆',	'🔅',	'🔌',	'🔋',	'🔍',	'🛁',	'🛀',	'🚿',
'🚽',	'🔧',	'🔩',	'🔨',	'🚪',	'🚬',	'💣',	'🔫',	'🔪',	'💊',	'💉',
'💰',	'💴',	'💵',	'💷',	'💶',	'💳',	'💸',	'📲',	'📧',	'📥',	'📤',
'✉',	'📩',	'📨',	'📯',	'📫',	'📪',	'📬',	'📭',	'📮',	'📦',	'📝',
'📄',	'📃',	'📑',	'📊',	'📈',	'📉',	'📜',	'📋',	'📅',	'📆',	'📇',
'📁',	'📂',	'✂',	'📌',	'📎',	'✒',	'✏',	'📏',	'📐',	'📕',	'📗',
'📘',	'📙',	'📓',	'📔',	'📒',	'📚',	'📖',	'🔖',	'📛',	'🔬',	'🔭',
'📰',	'🎨',	'🎬',	'🎤',	'🎧',	'🎼',	'🎵',	'🎶',	'🎹',	'🎻',	'🎺',
'🎷',	'🎸',	'👾',	'🎮',	'🃏',	'🎴',	'🀄',	'🎲',	'🎯',	'🏈',	'🏀',
'⚽',	'⚾',	'🎾',	'🎱',	'🏉',	'🎳',	'⛳',	'🚵',	'🚴',	'🏁',	'🏇',
'🏆',	'🎿',	'🏂',	'🏊',	'🏄',	'🎣',	'☕',	'🍵',	'🍶',	'🍼',	'🍺',
'🍻',	'🍸',	'🍹',	'🍷',	'🍴',	'🍕',	'🍔',	'🍟',	'🍗',	'🍖',	'🍝',
'🍛',	'🍤',	'🍱',	'🍣',	'🍥',	'🍙',	'🍘',	'🍚',	'🍜',	'🍲',	'🍢',
'🍡',	'🍳',	'🍞',	'🍩',	'🍮',	'🍦',	'🍨',	'🍧',	'🎂',	'🍰',	'🍪',
'🍫',	'🍬',	'🍭',	'🍯',	'🍎',	'🍏',	'🍊',	'🍋',	'🍒',	'🍇',	'🍉',
'🍓',	'🍑',	'🍈',	'🍌',	'🍐',	'🍍',	'🍠',	'🍆',	'🍅',	'🌽',	'',
],
  
  moji: ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と','な','に','ぬ','ね','の','は','ひ','ふ','へ','ほ','ま','み','む','め','も','や','ゆ','よ','ら','り','る','れ','ろ','わ','を','ん','゛','゜','っ','ゃ','ゅ','ょ','ぁ','ぃ','ぅ','ぇ','ぉ','ー','～','1','2','3','4','5','6','7','8','9','0']
  
};

const charactersPerRow = 7;

// タブ切り替え時に絵文字を表示
function showEmojis(category) {
    emojiKeyboard.innerHTML = '';
    emojis[category].forEach(emoji => {
        const emojiSpan = document.createElement('span');
        emojiSpan.textContent = emoji;
        emojiSpan.classList.add('emoji-item');  // スタイル付与のため
        emojiSpan.addEventListener('click', () => {
            currentEmoji = emoji; // 選択された絵文字をセット
            isDragging = true;    // ドラッグの準備
            // 選択中の絵文字をハイライト表示
            document.querySelectorAll('.emoji-item').forEach(item => item.classList.remove('selected-emoji'));
            emojiSpan.classList.add('selected-emoji');
        });
        emojiKeyboard.appendChild(emojiSpan);
    });
}



// 初期表示のタブを「顔」に設定
showEmojis('faces');
document.querySelector('.emoji-tab[data-category="faces"]').classList.add('selected');

// タブクリックで絵文字表示を更新
emojiTabs.addEventListener('click', (event) => {
    if (event.target.classList.contains('emoji-tab')) {
        document.querySelectorAll('.emoji-tab').forEach(tab => tab.classList.remove('selected'));
        event.target.classList.add('selected');
        showEmojis(event.target.dataset.category);
    }
});

// キャンバスの描画やイベントリスナーは既存のものをそのまま維持
// ... (既存のキャンバス操作コード)



// ボタンをクリックでポップアップ表示
createEmojiBtn.addEventListener('click', () => {
    const emojiPopup = document.getElementById('emojiPopup');
    if (emojiPopup) {
        emojiPopup.style.display = 'flex';
    }
});


// キャンセルボタンでポップアップ非表示
emojiCancelBtn.addEventListener('click', () => {
    emojiPopup.style.display = 'none';
    ctx.clearRect(0, 0, emojiCanvas.width, emojiCanvas.height); // ポップアップを閉じた際にキャンバスをクリア
    emojiPositions = []; // 配列もクリア
});

// タッチ開始時に絵文字をドラッグ開始
emojiCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDragging = true; // ドラッグを開始
});

// タッチ移動時に絵文字をキャンバス上で動かす
emojiCanvas.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const x = touch.clientX - emojiCanvas.getBoundingClientRect().left;
    const y = touch.clientY - emojiCanvas.getBoundingClientRect().top;

    // キャンバスをクリアして新しい位置に絵文字を描画
    drawAllEmojis(x, y); // 動いている絵文字を描画
});

// タッチ終了時に絵文字の配置を確定
emojiCanvas.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    isDragging = false; // ドラッグ終了

    const touch = e.changedTouches[0];
    const finalX = touch.clientX - emojiCanvas.getBoundingClientRect().left;
    const finalY = touch.clientY - emojiCanvas.getBoundingClientRect().top;

    // 確定位置に絵文字を配列に追加
    emojiPositions.push({ emoji: currentEmoji, position: { x: finalX, y: finalY } });

    // キャンバスをクリアして全ての絵文字を描画
    drawAllEmojis();

    // currentEmojiはリセットしない
});

// すべての絵文字を描画する関数
function drawAllEmojis(dragX = null, dragY = null) {
    ctx.clearRect(0, 0, emojiCanvas.width, emojiCanvas.height);
    ctx.font = '70px serif';

    // すべての絵文字を描画
    emojiPositions.forEach(({ emoji, position }) => {
        ctx.fillText(emoji, position.x, position.y);
    });

    // ドラッグ中の絵文字を描画（ドラッグ位置が提供されている場合）
    if (dragX !== null && dragY !== null) {
        ctx.fillText(currentEmoji, dragX, dragY);
    }
}


// クリアボタンのイベントリスナーを追加
const clearEmojiBtn = document.getElementById('clearCanvasBtn'); // クリアボタンのIDを指定してください
clearEmojiBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, emojiCanvas.width, emojiCanvas.height); // キャンバスをクリア
    emojiPositions = []; // 配列もクリア
});


// 完了ボタンでImgurにアップロード
emojiCompleteBtn.addEventListener('click', () => {
    const dataURL = emojiCanvas.toDataURL('image/png');

    // Imgurへアップロード
    fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
            Authorization: `Client-ID ${IMGUR_CLIENT_ID}`
        },
        body: dataURL.split(',')[1]
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const imageUrl = data.data.link;
            document.getElementById('tweetContent').value += `\n${imageUrl}`;
            emojiPopup.style.display = 'none';
            ctx.clearRect(0, 0, emojiCanvas.width, emojiCanvas.height); // アップロード後にキャンバスをクリア
            emojiPositions = []; // 配列もクリア
        }
    })
    .catch(error => console.error('画像のアップロードに失敗しました: ', error));
});