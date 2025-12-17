const domainName = window.location.hostname;
let loginService = "http://localhost:3001"
let normalServiceUrl = "http://localhost:3001"
let chatServiceUrl = "http://127.0.0.1:3010"
let modelServiceUrl = 'https://zg-cloud-model-service.replit.app';
let wxpayServiceUrl = 'https://wx-pay-116838-7-1320884641.sh.run.tcloudbase.com'
let goBackServiceUrl = 'https://golang-qo9o-116838-7-1320884641.sh.run.tcloudbase.com'

if (domainName === "localhost" || domainName === "dev.zcloudapp.com") {
    normalServiceUrl = "http://localhost:3001"
}

export async function login(username, password) {

    return fetch(`${loginService}/login?username=${username}&password=${password}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        // body: JSON.stringify(requestData),
    }).then(response => {
        if (response.status !== 200) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });
}

async function getToken() {
    const token = localStorage.getItem('token');
    return token ? `${token}` : null;
}

async function fetchApi(url, options = {}) {
    try {
        const token = await getToken(); // 等待 getToken 完成
        if (token) {
            options.headers = {
                ...(options.headers || {}),
                'Authorization': token
            };
        } else {
            window.location.href = '/login';
            console.log("未登录")
            return
        }

        if (!options.headers['Content-Type']) {
            options.headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, options);
        if (response.status === 401) {
            window.location.href = '/login';
            console.log("无权限")
            return;
        }
        if (response.status !== 200) {
            console.log('Error fetching API', response);
            // throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();

    } catch (error) {
        console.log('Network response was not ok', error);
        // throw error;  // 重新抛出错误
    }
}

async function fetchLocalApi(url, options = {}) {//专门处理私信的报错
    try {
        const response = await fetch(url, options);
        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }
        if (response.status !== 200) {
            console.log('Error fetching API', response);
            return response.status
            // throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();

    } catch (error) {
        console.log('Network response was not ok', error);
        return 10000
        // throw error;  // 重新抛出错误
    }
}

export async function postshortToLongLinks(data) {
    return fetchApi(`${normalServiceUrl}/transform_urls`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getTaskListApi(offset, count) {
    return fetchApi(`${normalServiceUrl}/task_list?offset=${offset}&count=${count}`, {
        method: 'GET',
    });
}

export async function getCommentListByTaskIdApi(taskId, page, size) {
    const offset = (page - 1) * size;
    return fetchApi(`${normalServiceUrl}/comments?task_id=${taskId}&&offset=${offset}&&count=${size}`, {
        method: 'GET',
    });
}

export async function postTestAnalysisApi(data) {
    return fetchApi(`${normalServiceUrl}/test_analysis`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function startAnalysisApi(data) {
    return fetchApi(`${normalServiceUrl}/analysis`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function stopAnalysisApi(data) {
    return fetchApi(`${normalServiceUrl}/stop_analysis`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getAnalysisProgressApi(taskId) {
    return fetchApi(`${normalServiceUrl}/progress?task_id=${taskId}&&step_type=2`, {
        method: 'GET',
    });
}

export async function getTaskIdtoDownloadApi(taskId) {
    return fetchApi(`${normalServiceUrl}/crawler_download?task_id=${taskId}`, {
        method: 'GET',
    });
}

export async function getTaskIdAnalysisResultApi(taskId) {
    return fetchApi(`${normalServiceUrl}/analysis_result?task_id=${taskId}`, {
        method: 'GET',
    });
}


export async function postCommentCrawlApi(data) {
    return fetchApi(`${normalServiceUrl}/comment_crawler`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getMarketListByTaskIdApi(task_id, offset, count) {
    return fetchApi(`${normalServiceUrl}/get_marketing_list?task_id=${task_id}&task_step_type=3&offset=${offset}&count=${count}`, {
        method: 'GET'
    });
}

export async function postStartMarketByTaskIdApi(data) {
    return fetchApi(`${chatServiceUrl}/start_marketing`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}


export async function postStopMarketByTaskIdApi(data) {
    return fetchApi(`${chatServiceUrl}/stop_marketing`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function postAnalysisSatisfactionApi(data) {
    return fetchApi(`${normalServiceUrl}/analyze_points`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getMarketProgressApi(task_id) {
    return fetchApi(`${normalServiceUrl}/marketing_progress?task_id=${task_id}`, {
        method: 'GET'
    });
}

export async function getMarketResultApi(task_id) {
    return fetchApi(`${normalServiceUrl}/marketing_result?task_id=${task_id}`, {
        method: 'GET'
    });
}

export async function deleteTaskApi(data) {
    return fetchApi(`${normalServiceUrl}/delete_task`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function postKeyword(data) {
    return fetchApi(`${modelServiceUrl}/chat_openai`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getTemplateApi() {
    return fetchApi(`${normalServiceUrl}/get_analysis_modules`, {
        method: 'GET'
    });
}

export async function createTemplateApi(data) {
    return fetchApi(`${normalServiceUrl}/create_analysis_module`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function deleteTemplateApi(data) {
    return fetchApi(`${normalServiceUrl}/delete_analysis_module`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateTemplateApi(data) {
    return fetchApi(`${normalServiceUrl}/update_analysis_module`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getUserInfo() {
    return fetchApi(`${normalServiceUrl}/user_info`, {
        method: 'GET'
    });
}

export async function getQuote() {
    return fetchApi(`${normalServiceUrl}/quota`, {
        method: 'GET'
    });
}

export async function getUserSatisfactionApi(taskId) {
    return fetchApi(`${normalServiceUrl}/get_user_satisfaction?task_id=${taskId}`, {
        method: 'GET'
    });
}

export async function testUserSatisfactionApi(taskId) {
    return fetchApi(`${normalServiceUrl}/test_user_satisfaction?task_id=${taskId}`, {//TODO:前期存在兼容已有用户的数据
        method: 'GET'
    });
}


export async function postWXPay(data) {
    return fetchApi(`${wxpayServiceUrl}/pay`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getDouyinAccounts() {
    return fetchLocalApi(`${chatServiceUrl}/get_douyin_accounts`, {
        method: 'GET'
    });
}

export async function postLoginDouyin() {
    return fetchLocalApi(`${chatServiceUrl}/login_douyin`, {
        method: 'POST'
    });
}

export async function getChatVersion() {
    return fetchLocalApi(`${chatServiceUrl}/get_version`, {
        method: 'GET'
    });
}

//保存与task相关的键值对
export async function getKvApi(taskId, jsonKey) {
    return fetchLocalApi(`${goBackServiceUrl}/api/get_kvcache?taskId=${taskId}&jsonKey=${jsonKey}`, {
        method: 'GET'
    });
}

export async function updateKvApi(data) {
    return fetchLocalApi(`${goBackServiceUrl}/api/update_kvcache`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function createKvApi(data) {
    return fetchLocalApi(`${goBackServiceUrl}/api/create_kvcache`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}


//保存小红书帖子的token
export async function getXhsApi(explore) {
    return fetchLocalApi(`${goBackServiceUrl}/api/xhs/get?explore=${explore}`, {
        method: 'GET'
    });
}

export async function updateXhsApi(data) {
    return fetchLocalApi(`${goBackServiceUrl}/api/xhs/update`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function createXhsApi(data) {
    return fetchLocalApi(`${goBackServiceUrl}/api/xhs/create`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}


export async function updateMarketingUserApi(data) {
    return fetchApi(`${normalServiceUrl}/update_marketing_user`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function batchUpdateMarketingUserApi(data) {
    return fetchApi(`${normalServiceUrl}/batch_update_marketing_user`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getAccountListApi() {
    return fetchApi(`${normalServiceUrl}/monitor_tasks`, {
        method: 'GET',
    });
}

export async function getUserInfosApi() {
    return fetchApi(`${normalServiceUrl}/user_infos`, {
        method: 'GET',
    });
}


export async function updateUserInfosApi(data) {
    return fetchApi(`${normalServiceUrl}/update_user_info`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}