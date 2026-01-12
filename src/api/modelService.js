import CryptoJS from 'crypto-js';
let modelServiceUrl = 'https://api.coze.cn/open_api/v2/chat';
let myToken = 'pat_URJWHQUzZqCnNRLV3oEYQCt44t4w3QYezRkAhtFzI9SodwzWUgAciOptMhMkT3im'
const chatbotMap = {
    "keyword": "7398469657676070947",
    "template": "7588974730418520115"
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
    // 防御性处理：确保 query 至少是空字符串，避免参数丢失
    const safeQuery = query || '';
    if (!safeQuery) {
        console.warn('[postChatModel] query 参数为空，使用默认值');
    }
    const data = {
        "conversation_id": generateConversationId().toString(),
        "bot_id": chatbotMap[mode],
        "user": checkAndGenerateUserId(),
        "query": safeQuery,
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
