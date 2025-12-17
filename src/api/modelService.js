import CryptoJS from 'crypto-js';
let modelServiceUrl = 'https://api.coze.cn/open_api/v2/chat';
let myToken = 'pat_PAgIS0o4LBBfV9SgMGvgSRA684mB4zf8vfpzxbEotjF5f8t3V4ZH5PnU5LhQXf7u'//pat_p9th9D78zNgfMHpdrDMGUmFhZjvY3ZE0uGP0sfZKumfVYMOEWxhyFyf7hx9Ts2KA pat_PAgIS0o4LBBfV9SgMGvgSRA684mB4zf8vfpzxbEotjF5f8t3V4ZH5PnU5LhQXf7u
const chatbotMap = {
    "keyword": "7398469657676070947",
    "template": "7424471959511269391"
}
// 检查localStorage中是否已经存在user_id
const checkAndGenerateUserId = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (userInfo.user_id) {
        return userInfo.user_id;
    }
    const username = userInfo.username;
    if (!username) {
        console.error('Username not found in userInfo');
        return;
    }
    const userIdHash = CryptoJS.SHA256(username).toString();
    const userId = userIdHash.substring(0, 14);
    userInfo.user_id = userId;
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    return userId;
}


const generateConversationId = () => {
    return Math.floor(Math.random() * 9999) + 1;
}

const options = {
    headers: {
        'Authorization': `Bearer ${myToken}`,
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Host': 'api.coze.cn',
        'Connection': 'keep-alive'
    }
};

export async function postChatModel(query, mode) {
    const data = {
        "conversation_id": generateConversationId().toString(),
        "bot_id": chatbotMap[mode],
        "user": checkAndGenerateUserId(),
        "query": query,
        "stream": false,
    }
    const response = await fetch(`${modelServiceUrl}`, {
        headers: { ...options.headers },
        method: 'POST',
        body: JSON.stringify(data),
    });
    const responseData = await response.json();
    return responseData
}
