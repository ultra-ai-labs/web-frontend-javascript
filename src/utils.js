// src/utils.js
export const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // 保证两位数
    const day = ('0' + date.getDate()).slice(-2); // 保证两位数
    const hours = ('0' + date.getHours()).slice(-2); // 保证两位数
    const minutes = ('0' + date.getMinutes()).slice(-2); // 保证两位数
    return `${year}-${month}-${day} ${hours}:${minutes}`;
};
