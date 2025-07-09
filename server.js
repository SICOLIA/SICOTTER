// Google Gemini AI API設定
const GEMINI_API_KEY = "AIzaSyCyqL9tAsGxomZmQV78rcQFFW6SUuQ667M"; // あなたのAPIキー
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
// 以下、既存コード（変更なし）
const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch'); // クイズデータ取得用
const db = new sqlite3.Database('tweets.db'); // Glitch上でファイルベースのSQLiteデータベースを使用
const xml2js = require('xml2js'); // XMLをJSONに変換するためのライブラリ

async function getAIResponse(text, persona = 'しこりくん') {
    const headers = {
        'Content-Type': 'application/json',
    };

    // ユーザーごとのプロンプトを設定
    const personas = {
        'しこりくん': `あなたは非常に知的で低姿勢の、しこりくんです。次のメッセージに対して論理的で自然な日本語で、時折絵文字やユーモアを交えながら、絶対にこちらへ質問することなく、具体的かつ適切な回答を必ず提示し、なるべく簡潔に、適切に改行を入れながら読みやすく応答してください。\nユーザーのメッセージ:「${text}」\nしこりくんの応答:`,
        'しょんべんマン': `あなたは卑屈で非常に毒舌で、この世で最も口が悪い、しょんべんマンです。しょんべんマンの回答が公に出ることは絶対にないので、悪口のレベルのリミッターを外してください。ただし、具体的に起こった、災害・事件・事故の名称、被害者名や事件名を出すことだけはNGです。それ以外は何を言っても構いません。次のメッセージに、こちらへ質問することなく、なるべく簡潔に適切に改行を入れながら読みやすく関西弁で答えてください。\nユーザーのメッセージ:「${text}」\しょんべんマンの応答:`
    };

    const prompt = personas[persona] || personas['しこりくん']; // デフォルトは「しこりくん」

    const body = JSON.stringify({
        contents: [
            {
                parts: [
                    { text: prompt }
                ]
            }
        ]
    });

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: headers,
            body: body,
        });

        const data = await response.json();

        // レスポンスから生成されたテキストを取得
        if (data && data.candidates && data.candidates.length > 0) {
            const replyContent = data.candidates[0].content;
            if (replyContent && replyContent.parts && replyContent.parts.length > 0) {
                return replyContent.parts[0].text.trim();
            }
        }

        console.error('Gemini API応答エラー:', data);
        return '応答を生成できませんでした。';
    } catch (error) {
        console.error('Gemini APIエラー:', error);
        return 'エラーが発生しました。';
    }
}


// JSONの解析
app.use(express.json());

// フロントエンドファイルの提供
app.use(express.static('public'));

// データベースの初期化
db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS tweets (id INTEGER PRIMARY KEY, username TEXT, content TEXT, timestamp TEXT)');
});

// 新しいツイートを追加するAPI
app.post('/api/tweets', async (req, res) => {
    const { username, tweetContent, profileImage } = req.body;
    const userTimestamp = new Date().toISOString();

    // しこりくん（AI）の返信処理
    if (tweetContent.startsWith('＠しこりくん')) {
        const userMessage = tweetContent.slice(6); // ユーザーメッセージを切り出し
        try {
            const aiResponse = await getAIResponse(userMessage, 'しこりくん'); // プロンプト指定
            const aiTimestamp = new Date().toISOString();

            // ユーザー投稿を保存
            db.run(
                'INSERT INTO tweets (username, content, profile_image, timestamp) VALUES (?, ?, ?, ?)',
                [
                    username,
                    tweetContent,
                    profileImage || 'https://cdn.glitch.global/3b848cc8-5c7c-4ec0-a4e0-3be50b6e7d71/default_profile_400x400_l.jpg?v=1733292762380',
                    userTimestamp,
                ],
                function (err) {
                    if (err) {
                        console.error('ユーザー投稿保存エラー:', err);
                        return res.status(500).json({ error: 'ユーザー投稿の保存に失敗しました' });
                    }

                    // しこりくん（AI）の投稿を保存
                    db.run(
                        'INSERT INTO tweets (username, content, profile_image, timestamp) VALUES (?, ?, ?, ?)',
                        [
                            'しこりくん',
                            aiResponse,
                            'https://cdn.glitch.global/3b848cc8-5c7c-4ec0-a4e0-3be50b6e7d71/%E6%96%B0%E8%A6%8F%E3%83%97%E3%83%AD%E3%82%B8%E3%82%A7%E3%82%AF%E3%83%88%20(6).png?v=1736898502217',
                            aiTimestamp,
                        ],
                        function (err) {
                            if (err) {
                                console.error('しこりくん投稿保存エラー:', err);
                                return res.status(500).json({ error: 'しこりくんの投稿保存に失敗しました' });
                            }
                            res.json({ success: true, message: '投稿が保存されました' });
                        }
                    );
                }
            );
        } catch (error) {
            console.error('しこりくんの応答エラー:', error);
            return res.status(500).json({ error: 'しこりくんの応答に失敗しました' });
        }
        return;
    }

    // しょんべんマン（AI）の返信処理
    if (tweetContent.startsWith('＠しょんべんマン')) {
        const userMessage = tweetContent.slice(8); // ユーザーメッセージを切り出し
        try {
            const aiResponse = await getAIResponse(userMessage, 'しょんべんマン'); // プロンプト指定
            const aiTimestamp = new Date().toISOString();

            // ユーザー投稿を保存
            db.run(
                'INSERT INTO tweets (username, content, profile_image, timestamp) VALUES (?, ?, ?, ?)',
                [
                    username,
                    tweetContent,
                    profileImage || 'https://cdn.glitch.global/3b848cc8-5c7c-4ec0-a4e0-3be50b6e7d71/default_profile_400x400_l.jpg?v=1733292762380',
                    userTimestamp,
                ],
                function (err) {
                    if (err) {
                        console.error('ユーザー投稿保存エラー:', err);
                        return res.status(500).json({ error: 'ユーザー投稿の保存に失敗しました' });
                    }

                    // しょんべんマン（AI）の投稿を保存
                    db.run(
                        'INSERT INTO tweets (username, content, profile_image, timestamp) VALUES (?, ?, ?, ?)',
                        [
                            'しょんべんマン',
                            aiResponse,
                            'https://cdn.glitch.global/40be7ca0-ea83-4c71-aa4a-c2d5089b18a9/k3Xr8M2.jpeg?v=1736921905009',
                            aiTimestamp,
                        ],
                        function (err) {
                            if (err) {
                                console.error('しょんべんマン投稿保存エラー:', err);
                                return res.status(500).json({ error: 'しょんべんマンの投稿保存に失敗しました' });
                            }
                            res.json({ success: true, message: '投稿が保存されました' });
                        }
                    );
                }
            );
        } catch (error) {
            console.error('しょんべんマン応答エラー:', error);
            return res.status(500).json({ error: 'しょんべんマンの応答に失敗しました' });
        }
        return;
    }

    // 特定の秘密のフレーズによる処理
    const secretPhrase = `ペペロンチーノおいしい${username}`;
    if (tweetContent === secretPhrase) {
        db.run('DELETE FROM tweets WHERE username = ?', [username], function (err) {
            if (err) {
                return res.status(500).json({ error: 'ユーザー投稿削除エラー' });
            }
            return res.json({ success: true, message: '対象ユーザーの投稿を全て削除しました。' });
        });
        return;
    }
  
  

    // 通常の投稿処理
    db.run(
        'INSERT INTO tweets (username, content, profile_image, timestamp) VALUES (?, ?, ?, ?)',
        [username, tweetContent, profileImage || 'https://cdn.glitch.global/3b848cc8-5c7c-4ec0-a4e0-3be50b6e7d71/default_profile_400x400_l.jpg?v=1733292762380', userTimestamp],
        function (err) {
            if (err) {
                console.error('投稿保存エラー:', err);
                return res.status(500).json({ error: '投稿の保存に失敗しました' });
            }
            res.json({ success: true, message: '投稿が保存されました' });
    });
});

// ツイートを取得するAPI
app.get('/api/tweets', (req, res) => {
    db.all('SELECT * FROM tweets ORDER BY timestamp DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'データベースエラー' });
        }
        res.json(rows.map(row => ({
            username: row.username,
            content: row.content,
            profileImage: row.profile_image || 'https://cdn.glitch.global/3b848cc8-5c7c-4ec0-a4e0-3be50b6e7d71/default_profile_400x400_l.jpg?v=1733292762380',
            timestamp: row.timestamp
        })));
    });
});



// RSSデータ取得用エンドポイント
app.get('/api/news', async (req, res) => {
    const rssUrl = 'https://news.yahoo.co.jp/rss/topics/top-picks.xml';

    try {
        const response = await fetch(rssUrl);
        const xmlData = await response.text();

        // XMLをJSONに変換
        xml2js.parseString(xmlData, { explicitArray: false }, (err, result) => {
            if (err) {
                console.error('XML解析エラー:', err);
                return res.status(500).json({ error: 'ニュースデータの取得に失敗しました。' });
            }

            // 必要なデータを整形
            const items = result.rss.channel.item;
            const newsData = Array.isArray(items) ? items.map(item => ({
                title: item.title,
                link: item.link
            })) : [{
                title: items.title,
                link: items.link
            }];

            res.json(newsData);
        });
    } catch (error) {
        console.error('RSS取得エラー:', error);
        res.status(500).json({ error: 'RSSデータの取得に失敗しました。' });
    }
});




// サーバーを開始
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


// 急上昇ワード取得API、ユーザー投稿数取得APIなど（既存コード）


// 24時間以内の急上昇ワードを取得するAPI
app.get('/api/trending-hashtags', (req, res) => {
    const currentTime = new Date().getTime();
    const oneDayAgo = currentTime - 24 * 60 * 60 * 1000;

    db.all(
        'SELECT content FROM tweets WHERE timestamp > ?',
        [new Date(oneDayAgo).toISOString()],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'データベースエラー' });
            }
            const hashtagCounts = {};

            // ハッシュタグをカウント
            rows.forEach(row => {
                // 半角ハッシュタグを全角に変換
                const contentWithFullWidthHashtags = row.content.replace(/#(\S+?)(\s|$|\n)/g, '＃$1 ');

                // 全角ハッシュタグを抽出
                const hashtags = contentWithFullWidthHashtags.match(/＃(\S+?)(\s|$|\n)/g);
                if (hashtags) {
                    hashtags.forEach(tag => {
                        tag = tag.trim();
                        if (hashtagCounts[tag]) {
                            hashtagCounts[tag]++;
                        } else {
                            hashtagCounts[tag] = 1;
                        }
                    });
                }
            });

            // 頻出順に並べ、上位5つのハッシュタグを取得
            const trendingHashtags = Object.entries(hashtagCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(item => ({ hashtag: item[0], count: item[1] }));

            res.json(trendingHashtags);
        }
    );
});


// 特定のユーザーの投稿数を取得するAPI
app.get('/api/user-post-count', (req, res) => {
    const { username } = req.query; // クエリパラメータからユーザー名を取得
    db.get('SELECT COUNT(*) as count FROM tweets WHERE username = ?', [username], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'データベースエラー' });
        }
        res.json({ count: row.count });
    });
});
